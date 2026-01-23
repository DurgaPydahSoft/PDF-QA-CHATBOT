from .embeddings import generate_embeddings
from .vector_store import VectorStore
from .llm import get_llm_response
from typing import List, Dict, Optional

class QAAgent:
    def __init__(self, vector_store: VectorStore):
        self.vector_store = vector_store

    def get_initial_suggestions(self) -> list:
        """Generates 3 initial questions based on the document content."""
        if not self.vector_store.chunks:
            return ["What can you tell me about these documents?", "Can you summarize the main points?", "What are the key takeaways?"]
            
        # Use first few chunks to get a sense of the document
        sample_context = "\n---\n".join(self.vector_store.chunks[:5])
        prompt = f"""You are an expert document analyst. Based on the following document snippets, suggest exactly 3 unique, engaging, and highly relevant questions a user might want to ask to understand this document better.
        
        Context:
        {sample_context}
        
        Recall that the questions should be short and concise (max 10 words).
        
        Return ONLY the questions, one per line, starting with a number.
        """
        response = get_llm_response(prompt)
        suggestions = []
        for line in response.strip().split('\n'):
            line = line.strip()
            if not line: continue
            
            # Remove leading numbers, dashes, or dots
            import re
            clean_line = re.sub(r'^[\d\.\-\s]+', '', line).strip()
            if clean_line:
                suggestions.append(clean_line)
                
        return suggestions[:3]

    def ask(self, question: str, conversation_history: Optional[List[Dict[str, str]]] = None, max_history_messages: int = 6) -> dict:
        """Performs RAG to answer the user question.
        
        Args:
            question: The current question to answer
            conversation_history: Optional list of previous messages in format [{"role": "user/bot", "content": "..."}]
            max_history_messages: Maximum number of history messages to include (default: 6, i.e., last 3 exchanges)
        """
        import time
        t0 = time.perf_counter()
        
        # Apply sliding window to conversation history
        if conversation_history:
            # Limit to last N messages to control token usage
            conversation_history = conversation_history[-max_history_messages:]
            print(f"DEBUG: Using {len(conversation_history)} messages from conversation history")
            # Debug: Print first and last message to verify history
            if len(conversation_history) > 0:
                print(f"DEBUG: First history message: {conversation_history[0].get('role', 'unknown')} - {conversation_history[0].get('content', '')[:100]}...")
                print(f"DEBUG: Last history message: {conversation_history[-1].get('role', 'unknown')} - {conversation_history[-1].get('content', '')[:100]}...")
        
        # 1. Generate embedding for the question
        query_emb = generate_embeddings([question])[0]
        t1 = time.perf_counter()
        print(f"DEBUG: Embedding generation took {t1 - t0:.2f}s")
        
        # 2. Search for relevant chunks
        if hasattr(self.vector_store, 'chunks'):
            print(f"DEBUG: Total chunks in store: {len(self.vector_store.chunks)}")
        relevant_chunks = self.vector_store.search(query_emb, k=5)
        t2 = time.perf_counter()
        print(f"DEBUG: Vector search took {t2 - t1:.2f}s")
        
        if not relevant_chunks:
            return {
                "answer": "👋 I'm sorry, but I couldn't find any specific information in the documents to answer that. Could you try rephrasing or asking something else? I'm here to help! 😊",
                "sources": []
            }
        
        # 3. Construct prompt with context
        # Extract text and metadata from chunks
        context_parts = []
        sources_set = set()
        
        for chunk_tuple in relevant_chunks:
            # Handle potential unpacking issues if tuple size varies
            if len(chunk_tuple) == 3:
                text, score, meta = chunk_tuple
                source = meta.get('file_name', 'Unknown File')
                if source != 'Unknown File':
                    sources_set.add(source)
                context_parts.append(f"[Source: {source}]\n{text}")
            else:
                text, score = chunk_tuple
                context_parts.append(f"[Source: Unknown]\n{text}")

        context = "\n\n---\n\n".join(context_parts)
        
        # Build the current question prompt
        # If there's conversation history, explicitly reference it
        if conversation_history and len(conversation_history) > 0:
            # Extract key entities from previous conversation for context
            # This helps the LLM understand what "both", "they", "these" refer to
            previous_context_hint = ""
            # Look for mentions of names or key topics in recent history
            for msg in conversation_history[-4:]:  # Check last 4 messages
                content = msg.get('content', '')
                if len(content) > 50:  # Only use substantial messages
                    # Extract first 200 chars as context hint
                    previous_context_hint += content[:200] + "... "
            
            # Build a prompt that explicitly references the conversation history
            prompt = f"""You are a friendly, enthusiastic, and highly intelligent AI assistant. Your goal is to provide impressive, enjoyable, and helpful insights from the document.

Guidelines:
- **Tone**: Be warm, engaging, and slightly conversational. Use occasional emojis (like ✨, 🚀, 📚, 💡) to make the response lively!
- **Be Concise but Impressive**: Explain things clearly but with flair.
- **Cite Sources**: Always cite the source file for your information using the format **[Source: filename]**.
- **Structure**: Use clear headers and bullet points for readability.
- **No Hallucinations**: Answer ONLY based on the provided context.
- **Formatting**: Use Markdown for headers (#), bold (**), and lists.
- **Conversation Continuity**: This is a FOLLOW-UP question in an ongoing conversation. You MUST reference the previous conversation messages shown above to understand what the current question is asking about. If the question uses pronouns like "both", "they", "these", "among", "who", look at the previous conversation to see who/what was being discussed.

**CRITICAL**: This question is part of an ongoing conversation. The question may refer to people, topics, or comparisons mentioned in the previous messages above. You MUST:
1. Look at the previous conversation to understand what "both", "they", "these", "among" refer to
2. Explicitly reference the previous conversation in your answer (e.g., "Based on the previous comparison of X and Y...")
3. Combine information from BOTH the document context AND the conversation history

Current Question: {question}

Provide a structured answer that:
1. **Explicitly references** the previous conversation when relevant
2. Uses the document context to provide accurate information
3. Maintains conversation continuity
4. At the very end, includes a section 'Suggestions:' with exactly 3 short, relevant follow-up questions (maximum 10 words each). Format them as a numbered list (1., 2., 3.).

Answer:"""
        else:
            # No history, use standard prompt
            prompt = f"""You are a friendly, enthusiastic, and highly intelligent AI assistant. Your goal is to provide impressive, enjoyable, and helpful insights from the document.

Guidelines:
- **Tone**: Be warm, engaging, and slightly conversational. Use occasional emojis (like ✨, 🚀, 📚, 💡) to make the response lively!
- **Be Concise but Impressive**: Explain things clearly but with flair.
- **Cite Sources**: Always cite the source file for your information using the format **[Source: filename]**.
- **Structure**: Use clear headers and bullet points for readability.
- **No Hallucinations**: Answer ONLY based on the provided context.
- **Formatting**: Use Markdown for headers (#), bold (**), and lists.

Current Question: {question}

Provide a structured answer. At the very end, include a section 'Suggestions:' with exactly 3 short, relevant follow-up questions (maximum 10 words each). Format them as a numbered list (1., 2., 3.).

Answer:"""

        # 4. Get response from LLM with conversation history and RAG context
        t3 = time.perf_counter()
        # Pass both the prompt (question) and the RAG context separately
        response = get_llm_response(
            prompt, 
            conversation_history=conversation_history,
            rag_context=context
        )
        t4 = time.perf_counter()
        print(f"DEBUG: LLM generation took {t4 - t3:.2f}s")
        print(f"DEBUG: Total RAG time: {t4 - t0:.2f}s")
        
        # Clean up response to remove potential trailing asterisks or whitespace
        response = response.strip()
        # Remove trailing markdown bold markers often left by LLM
        while response.endswith("**"):
            response = response[:-2].rstrip()
            
        # Also handle cases where it ends with **. or ** (space)
        # Also handle cases where it ends with **. or ** (space)
        if response.endswith("**."):
            response = response[:-3].strip() + "."
            
        # Extract sources actually cited by the LLM
        import re
        cited_sources = re.findall(r'\[Source:\s*(.*?)\]', response)
        # Clean up any potential markdown artifacts from the captured group
        clean_cited_sources = []
        for src in cited_sources:
            # Remove bold markers if they were captured inside (unlikely but safe)
            clean = src.replace('**', '').strip()
            if clean and clean != 'Unknown': 
                clean_cited_sources.append(clean)
        
        final_sources = list(set(clean_cited_sources))
        
        # Fallback: If LLM didn't cite anything, show all headers? 
        # Or better: if it cites, show ONLY those. If not, show all candidates.
        if not final_sources:
            final_sources = list(sources_set)
            
        return {
            "answer": response,
            "sources": final_sources
        }
            


if __name__ == "__main__":
    # Mock test
    vs = VectorStore()
    # Assume vs has some data...
    agent = QAAgent(vs)
    # print(agent.ask("What is the main topic?"))
