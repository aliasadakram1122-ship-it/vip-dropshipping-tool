export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { link } = req.body;
        if (!link) return res.status(400).json({ error: 'Product link is required' });

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        const prompt = `I am dropshipping this product on eBay UK. Product link/info: ${link}. 
        Please provide ONLY a raw JSON response with two keys:
        1. "title": An optimized, highly searchable eBay SEO title (Maximum 80 characters). No special symbols.
        2. "description": A highly professional, plain text product description formatted for eBay. Include Bullet points for features. Do NOT include any HTML tags. Do NOT include any personal names anywhere in the text. Include a standard "Free UK Shipping & 30-Day Returns" policy at the bottom.`;

        // New Official Google Interactions API Endpoint
        const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/interactions?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "models/gemini-1.5-flash", // 👈 یہاں ہم نے ماڈل کا نام ایڈ کر دیا ہے
                input: prompt
            })
        });

        const aiData = await aiRes.json();
        if (aiData.error) throw new Error("Google API Error: " + aiData.error.message);

        // Parse Response from Interactions API
        let outputText = "";
        if (aiData.output) {
            outputText = typeof aiData.output === 'string' ? aiData.output : JSON.stringify(aiData.output);
        } else if (aiData.candidates && aiData.candidates[0]?.content?.parts?.[0]?.text) {
            outputText = aiData.candidates[0].content.parts[0].text;
        } else {
            outputText = JSON.stringify(aiData);
        }

        const cleanJsonString = outputText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedResult = JSON.parse(cleanJsonString);

        return res.status(200).json(parsedResult);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
}
