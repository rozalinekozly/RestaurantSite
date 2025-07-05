import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import fs from 'fs';

// Load chef names and prompts
const chefNames = JSON.parse(fs.readFileSync('./scripts/chef_names.json', 'utf-8'));
const prompts = JSON.parse(fs.readFileSync('./scripts/prompts.json', 'utf-8'));

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate AI caption using GPT-3.5
async function generateCaption(prompt) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are an Italian chef sharing warm, aesthetic, concise daily updates for social media, focusing on food and cozy Italian bistro vibes.',
        },
        {
          role: 'user',
          content: `Write a short, engaging Instagram-style caption about: ${prompt}`,
        },
      ],
      max_tokens: 50,
      temperature: 0.7,
    });

    const caption = completion.choices[0].message.content.trim().replace(/^["']|["']$/g, '');
    console.log('Generated Caption:', caption);
    return caption;
  } catch (error) {
    console.error('Error generating caption:', error);
    return "Today's special at Rosmarino!";
  }
}

// Generate AI image using DALL·E with safe, aesthetic context
async function generateImage(prompt) {
  try {
    const detailedPrompt = `A high-quality, aesthetic food photography image of ${prompt} in an Italian bistro, natural lighting, Instagram aesthetic, cozy atmosphere, rustic wooden table.`;
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: detailedPrompt,
      size: '1024x1024',
      quality: 'standard',
    });

    const imageUrl = response.data[0].url;
    console.log('Generated Image URL:', imageUrl);
    return imageUrl;
  } catch (error) {
    console.error('Error generating image:', error);
    return null;
  }
}

async function generateChefPost() {
  try {
    // Check count and delete oldest if >= 1000
    const { count } = await supabase
      .from('chef_posts')
      .select('*', { count: 'exact', head: true });

    if (count >= 1000) {
      const { data: oldest } = await supabase
        .from('chef_posts')
        .select('id')
        .order('created_at', { ascending: true })
        .limit(1);

      if (oldest && oldest.length > 0) {
        await supabase.from('chef_posts').delete().eq('id', oldest[0].id);
        console.log(`Deleted oldest post with id: ${oldest[0].id}`);
      }
    }

    // Randomly select prompt and chef
    const prompt = prompts[Math.floor(Math.random() * prompts.length)];
    const chefName = chefNames[Math.floor(Math.random() * chefNames.length)];

    // Generate caption and image
    console.log(`Generating content for prompt: "${prompt}"`);
    const caption = await generateCaption(prompt);
    const imageUrl = await generateImage(prompt);

    if (!imageUrl) {
      console.error('❌ Failed to generate image, skipping post.');
      return;
    }

    // Insert post into Supabase
    const { error } = await supabase.from('chef_posts').insert([
      {
        chef_name: chefName,
        caption: caption,
        image_url: imageUrl,
      },
    ]);

    if (error) {
      console.error('❌ Error inserting post into Supabase:', error);
    } else {
      console.log(`✅ Successfully posted: "${caption}" by ${chefName}`);
    }
  } catch (error) {
    console.error('❌ Error in generateChefPost:', error);
  }
}

generateChefPost();
