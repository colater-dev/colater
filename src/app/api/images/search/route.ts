import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query");
    const page = searchParams.get("page") || "1";
    const per_page = searchParams.get("per_page") || "20";

    if (!query) {
        return NextResponse.json({ error: "Query parameter is required" }, { status: 400 });
    }

    const accessKey = process.env.UNSPLASH_ACCESS_KEY;

    if (!accessKey) {
        // Return mock data if no API key is present, for development
        console.warn("UNSPLASH_ACCESS_KEY is not set. Returning mock data.");
        return NextResponse.json({
            total: 1,
            total_pages: 1,
            results: [
                {
                    id: "mock-1",
                    width: 1080,
                    height: 1080,
                    color: "#f5f5f5",
                    blur_hash: "L5H2EC=PM{yV0g-mq.wG9c0100_3",
                    description: "Mock image for testing",
                    alt_description: "A placeholder image",
                    urls: {
                        regular: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop",
                        small: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop",
                        thumb: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&auto=format&fit=crop",
                    },
                    user: {
                        name: "Mock User",
                        username: "mockuser",
                        links: { html: "#" }
                    },
                    links: { html: "#" }
                }
            ]
        });
    }

    try {
        const response = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${per_page}&orientation=squarish`,
            {
                headers: {
                    Authorization: `Client-ID ${accessKey}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Unsplash API error: ${response.statusText}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: unknown) {
        console.error("Error fetching from Unsplash:", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch images" }, { status: 500 });
    }
}
