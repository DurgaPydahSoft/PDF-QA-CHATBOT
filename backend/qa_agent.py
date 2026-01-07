from embeddings import generate_embeddings
from vector_store import VectorStore
from llm_client import get_llm_response

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

    def ask(self, question: str) -> str:
        """Performs RAG to answer the user question."""
        # 1. Generate embedding for the question
        query_emb = generate_embeddings([question])[0]
        
        # 2. Search for relevant chunks
        relevant_chunks = self.vector_store.search(query_emb, k=3)
        
        if not relevant_chunks:
            return "👋 I'm sorry, but I couldn't find any specific information in the documents to answer that. Could you try rephrasing or asking something else? I'm here to help! 😊"
        
        # 3. Construct prompt with context
        context = "\n---\n".join([chunk for chunk, dist in relevant_chunks])
        prompt = f"""You are a professional, sharp, and highly intelligent AI analyst. Your goal is to provide structured and concise insights from the document.

Guidelines:
- **Be Concise**: Get straight to the point. Avoid fluff or filler phrases like "Here is the information you requested".
- **Structure**: Use clear headers and bullet points for readability.
- **Tone**: Professional, confident, and helpful.
- **No Hallucinations**: Answer ONLY based on the provided context.
- **Formatting**: Use Markdown for headers (#), bold (**), and lists.

Context:
{context}

Question: {question}

Provide a structured answer. At the very end, include a section 'Suggestions:' with exactly 3 short, relevant follow-up questions (maximum 10 words each). Format them as a numbered list (1., 2., 3.).

Answer:"""

        # 4. Get response from LLM
        return get_llm_response(prompt)

if __name__ == "__main__":
    # Mock test
    vs = VectorStore()
    # Assume vs has some data...
    agent = QAAgent(vs)
    # print(agent.ask("What is the main topic?"))
