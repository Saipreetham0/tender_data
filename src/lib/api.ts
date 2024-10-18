// lib/api.ts
export async function fetchTenderData(campus: string) {
    try {
      const response = await fetch(`http://localhost:3000/api/tenders/${campus}`, {
        next: { revalidate: 3600 } // Revalidate every hour
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching ${campus} tenders:`, error);
      return { success: false, data: [], source: campus };
    }
  }