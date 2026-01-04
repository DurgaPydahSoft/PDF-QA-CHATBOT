from embeddings import generate_embeddings
from vector_store import VectorStore
from llm_client import get_llm_response

class QAAgent:
    def __init__(self, vector_store: VectorStore):
        self.vector_store = vector_store

    def ask(self, question: str) -> str:
        """Performs RAG to answer the user question."""
        # 1. Generate embedding for the question
        query_emb = generate_embeddings([question])[0]
        
        # 2. Search for relevant chunks
        relevant_chunks = self.vector_store.search(query_emb, k=3)
        
        if not relevant_chunks:
            return "I couldn't find any relevant information in the document to answer your question."
        
        # 3. Construct prompt with context
        context = "\n---\n".join([chunk for chunk, dist in relevant_chunks])
        prompt = f"""You are a friendly and proactive AI assistant. Answer the question based ONLY on the provided context. 
If the answer is not in the context, politely say that you don't know based on the document.

Your goal is to be helpful and engaging. 

Context:
{context}

Question: {question}

Answer in a natural, helpful tone. At the very end of your response, always provide exactly 3 brief follow-up questions that the user might want to ask next, prefixed with 'Suggestions:'.

Example format:
... your answer here ...

Suggestions:
1. [Question 1]
2. [Question 2]
3. [Question 3]

Answer:"""

        # 4. Get response from LLM
        return get_llm_response(prompt)

if __name__ == "__main__":
    # Mock test
    vs = VectorStore()
    # Assume vs has some data...
    agent = QAAgent(vs)
    # print(agent.ask("What is the main topic?"))
