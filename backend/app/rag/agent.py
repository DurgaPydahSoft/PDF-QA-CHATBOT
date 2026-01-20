from .embeddings import generate_embeddings
from .vector_store import VectorStore
from .llm import get_llm_response

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

    def ask(self, question: str) -> dict:
        """Performs RAG to answer the user question."""
        import time
        t0 = time.perf_counter()
        
        # 1. Generate embedding for the question
        query_emb = generate_embeddings([question])[0]
        t1 = time.perf_counter()
        print(f"DEBUG: Embedding generation took {t1 - t0:.2f}s")
        
        # 2. Search for relevant chunks
        # 2. Search for relevant chunks
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
        
        prompt = f"""You are a friendly, enthusiastic, and highly intelligent AI assistant. Your goal is to provide impressive, enjoyable, and helpful insights from the document.

Guidelines:
- **Tone**: Be warm, engaging, and slightly conversational. Use occasional emojis (like ✨, 🚀, 📚, 💡) to make the response lively!
- **Be Concise but Impressive**: Explain things clearly but with flair.
- **Cite Sources**: ALways cite the source file for your information using the format **[Source: filename]**.
- **Structure**: Use clear headers and bullet points for readability.
- **No Hallucinations**: Answer ONLY based on the provided context.
- **Formatting**: Use Markdown for headers (#), bold (**), and lists.

Context:
{context}

Question: {question}

Provide a structured answer. At the very end, include a section 'Suggestions:' with exactly 3 short, relevant follow-up questions (maximum 10 words each). Format them as a numbered list (1., 2., 3.).

Answer:"""

        # 4. Get response from LLM
        t3 = time.perf_counter()
        response = get_llm_response(prompt)
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
