
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const chefNames = ["Chef Luigi", "Chef Sofia", "Chef Marco", "Chef Isabella"];
const prompts = [

  "A chef's counter with fresh handmade pasta being rolled on a rustic wooden table, basil and olive oil nearby, warm clean light",
  
  "A chef's prep stand with fresh basil, ripe tomatoes, and a bottle of olive oil on a marble counter, soft morning light in an Italian kitchen",
  
  "A chef stirring creamy risotto in a copper pot on a wooden stove counter, herbs and parmesan nearby, warm rustic light",
  
  "A chef scooping lemon sorbet into small bowls in a cozy Italian cafe kitchen, wooden counter, soft warm light",
  
  "A chef dusting cocoa powder over a tiramisu on a wooden counter, simple plating with a warm clean bistro light",
  
  "A chef sliding a wood-fired pizza into a brick oven, rustic wooden counter with fresh toppings, warm Italian trattoria light",
  
  "A chef pouring espresso into a vintage cup with biscotti on a marble counter, warm cozy Italian cafe ambiance"
];

;

async function downloadImage(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer);
}

async function generateChefPost() {
  try {
    const prompt = prompts[Math.floor(Math.random() * prompts.length)];
    const chefName = chefNames[Math.floor(Math.random() * chefNames.length)];

    console.log(`Generating image for: "${prompt}"`);

    // Generate image using OpenAI
    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      size: "1024x1024",
      n: 1
    });

    const imageUrl = imageResponse.data[0].url;
    console.log(`Temporary Image URL: ${imageUrl}`);

    // Download the generated image
    const imageBuffer = await downloadImage(imageUrl);
    const fileName = `chef_post_${Date.now()}.png`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('chefposts')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      console.error("Error uploading to Supabase Storage:", uploadError);
      return;
    }

    // Retrieve public URL
    const { data: publicUrlData } = supabase
      .storage
      .from('chefposts')
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;
    console.log(`Permanent Image URL: ${publicUrl}`);

    // Generate caption
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "system", content: `Write a short, warm, Instagram-style caption for this image: ${prompt}. Focus on Italian vibes and cozy restaurant feel.` }],
    });

    const caption = completion.choices[0].message.content.trim();
    console.log(`Generated caption: ${caption}`);

    // Insert into Supabase table
    const { error: insertError } = await supabase.from('chef_posts').insert([
      {
        chef_name: chefName,
        caption: caption,
        image_url: publicUrl
      }
    ]);

    if (insertError) {
      console.error("Error inserting post into Supabase:", insertError);
      return;
    }

    console.log(`Successfully posted: "${caption}" by ${chefName}`);
  } catch (error) {
    console.error("Error generating chef post:", error);
  }
}

generateChefPost();
