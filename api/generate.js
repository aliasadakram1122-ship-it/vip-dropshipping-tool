export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { link } = req.body;
        if (!link) return res.status(400).json({ error: 'Product link is required' });

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        // 1. گوگل سے پوچھیں کہ کون سے ماڈلز اویلیبل ہیں (Auto-Detect)
        const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
        const modelsData = await modelsRes.json();
        
        if (modelsData.error) throw new Error("API Key Error: " + modelsData.error.message);

        // 2. سب سے بہترین چلنے والا ماڈل خود سلیکٹ کریں
        let targetModel = "models/gemini-1.5-flash"; // Default
        if (modelsData.models) {
            const validModel = modelsData.models.find(m => 
                m.supportedGenerationMethods && 
                m.supportedGenerationMethods.includes("generateContent") &&
                m.name.includes("gemini")
            );
            if (validModel) {
                targetModel = validModel.name; // یہ خود صحیح نام اٹھا لے گا
            }
        }

        const prompt = `I am dropshipping this product on eBay UK. Product link/info: ${link}. 
        Please provide ONLY a JSON response with two keys:
        1. "title": An optimized, highly searchable eBay SEO title (Maximum 80 characters). No special symbols.
        2. "description": A highly professional, plain text product description formatted for eBay. Include Bullet points for features. Do NOT include any HTML tags. Include a standard "Free UK Shipping & 30-Day Returns" policy at the bottom.`;

        // 3. آٹو سلیکٹڈ ماڈل کے ذریعے ڈیٹا منگوائیں
        const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/${targetModel}:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const aiData = await aiRes.json();
        if (aiData.error) throw new Error(aiData.error.message);

        // 4. رزلٹ کو کلین کر کے ویب سائٹ پر بھیجیں
        const rawText = aiData.candidates[0].content.parts[0].text;
        const cleanJsonString = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedResult = JSON.parse(cleanJsonString);

        return res.status(200).json(parsedResult);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
}
