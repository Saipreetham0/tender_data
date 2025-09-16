// lib/api.ts
export async function fetchTenderData(campus: string) {
    try {
      const response = await fetch(`/api/tenders/${campus}`, {
        next: { revalidate: 3600 } // Revalidate every hour
      });

      if (!response.ok) {
        // Handle 503 Service Unavailable specifically (disabled routes)
        if (response.status === 503) {
          console.warn(`${campus} tender route is temporarily disabled`);
          return {
            success: false,
            data: [],
            source: campus,
            disabled: true,
            message: `${campus} tender route is temporarily disabled`
          };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching ${campus} tenders:`, error);
      return {
        success: false,
        data: [],
        source: campus,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }