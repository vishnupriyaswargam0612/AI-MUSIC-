from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os
import random
import datetime
import google.generativeai as genai

# Ensure backend/covers directory exists to store generated covers
COVERS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "covers")

def get_font(font_name, size):
    # Standard font paths on Windows
    font_paths = [
        font_name,
        os.path.join("C:\\Windows\\Fonts", font_name),
        os.path.join("C:\\Windows\\Fonts", font_name.lower()),
        "arial.ttf"
    ]
    for path in font_paths:
        try:
            return ImageFont.truetype(path, size)
        except IOError:
            continue
    return ImageFont.load_default()

def generate_svg_with_gemini(mood, scenario, api_key):
    try:
        genai.configure(api_key=api_key)
        # Using gemini-1.5-flash as the fast, efficient model
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = f"""
        You are a world-class abstract graphic designer. Compose a stunning, modern, minimalist music album cover in SVG format.
        The music mood/genre is: {mood}
        The album scenario is: "{scenario}"
        
        Instructions:
        1. Return ONLY the raw SVG code. Do NOT wrap in markdown code blocks (such as ```svg or ```xml), no markdown text, no comments, and no explanations. Start directly with '<svg' and end with '</svg>'.
        2. Set width="100%", height="100%", viewBox="0 0 500 500".
        3. Use rich, modern visual aesthetics. Employ beautiful gradients, layered geometric paths, glowing elements, or smooth curves that match the mood:
           - happy: warm vibrant gradients (yellow, orange, coral), bubbly floating circles, sunburst.
           - sad: deep dark gradients (blue, dark slate), rain lines, minimal lines/curves.
           - relaxed: soothing pastel gradients (teal, emerald green, soft sky blue), organic wave paths.
           - romantic: passionate gradients (magenta, pink, deep violet), abstract overlapping shapes/curves.
           - energetic: high contrast dark backdrops with neon yellow/pink slashes, zigzags, angular paths.
        4. Render the title "{scenario}" and the subtitle "// {mood.upper()} VIBE" beautifully inside the SVG using <text> tags with high readability, good layout, and contrast. Use a font-family like 'system-ui', 'Outfit', or 'Segoe UI'.
        5. Ensure the SVG is valid XML and renders flawlessly in standard web browsers.
        """
        
        response = model.generate_content(prompt)
        svg_content = response.text.strip()
        
        # Clean markdown formatting if present
        if svg_content.startswith("```"):
            lines = svg_content.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1].startswith("```"):
                lines = lines[:-1]
            svg_content = "\n".join(lines).strip()
            
        return svg_content
    except Exception as e:
        print(f"Gemini SVG generation error: {e}")
        return None

def generate_album_cover(mood, song_title, user_email, db_path=None, api_key=None):
    os.makedirs(COVERS_DIR, exist_ok=True)
    
    # Try Gemini generation first if API key is provided
    if api_key:
        print(f"Calling Gemini API to generate album cover for: {song_title} ({mood})...")
        svg_code = generate_svg_with_gemini(mood, song_title, api_key)
        if svg_code and "<svg" in svg_code and "</svg>" in svg_code:
            filename = f"cover_{mood}_{int(random.random() * 1000000)}.svg"
            save_path = os.path.join(COVERS_DIR, filename)
            with open(save_path, "w", encoding="utf-8") as f:
                f.write(svg_code)
            print(f"Successfully generated AI cover: {filename}")
            return f"/covers/{filename}"
        else:
            print("Gemini generation failed or returned invalid SVG. Falling back to procedural generation...")

    # Fallback to local Pillow procedural PNG generator
    gradient_map = {
        "happy": [
            (250, 217, 97),  # Gold
            (247, 107, 28),  # Orange
            (255, 107, 139), # Coral Pink
            (255, 142, 83)   # Peach
        ],
        "sad": [
            (15, 32, 39),    # Dark slate
            (32, 58, 67),    # Dark teal
            (44, 83, 100),   # Steel blue
            (31, 28, 44)     # Dark indigo
        ],
        "relaxed": [
            (17, 153, 142),  # Mint green
            (56, 239, 125),  # Emerald
            (168, 255, 120), # Light green
            (120, 255, 214)  # Seafoam
        ],
        "romantic": [
            (248, 87, 166),  # Hot pink
            (255, 88, 88),   # Coral red
            (127, 0, 255),   # Purple
            (224, 195, 252)  # Soft lavender
        ],
        "energetic": [
            (17, 17, 17),    # Deep black
            (34, 34, 34),    # Dark grey
            (241, 39, 17),   # Electric red
            (245, 175, 25)   # Electric yellow
        ]
    }
    
    colors = gradient_map.get(mood.lower(), gradient_map["happy"])
    
    # Create 2x2 image and resize to 500x500 for bilinear interpolation gradient
    temp_img = Image.new("RGB", (2, 2))
    temp_img.putpixel((0, 0), colors[0])
    temp_img.putpixel((1, 0), colors[1])
    temp_img.putpixel((0, 1), colors[2])
    temp_img.putpixel((1, 1), colors[3])
    
    cover = temp_img.resize((500, 500), Image.Resampling.BILINEAR)
    
    # Draw mood-specific geometric overlay art
    overlay = Image.new("RGBA", (500, 500), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    if mood.lower() == "happy":
        for _ in range(12):
            x = random.randint(0, 500)
            y = random.randint(0, 500)
            r = random.randint(15, 60)
            alpha = random.randint(30, 80)
            draw.ellipse([x-r, y-r, x+r, y+r], fill=(255, 255, 255, alpha))
            
    elif mood.lower() == "sad":
        for _ in range(40):
            x = random.randint(0, 500)
            y = random.randint(0, 400)
            length = random.randint(30, 90)
            alpha = random.randint(40, 100)
            draw.line([x, y, x + 5, y + length], fill=(200, 220, 255, alpha), width=1)
            
    elif mood.lower() == "relaxed":
        for i in range(4):
            y_base = 250 + i * 40
            points = []
            for x in range(0, 501, 50):
                import math
                y = y_base + int(25 * math.sin(x / 80.0 + i))
                points.append((x, y))
            for j in range(len(points) - 1):
                alpha = random.randint(30, 70)
                draw.line([points[j], points[j+1]], fill=(255, 255, 255, alpha), width=8 - i)

    elif mood.lower() == "romantic":
        for _ in range(8):
            x = random.randint(50, 450)
            y = random.randint(50, 450)
            r = random.randint(20, 50)
            alpha = random.randint(35, 75)
            draw.polygon([
                (x, y - r),
                (x + r, y),
                (x, y + r),
                (x - r, y)
            ], fill=(255, 100, 150, alpha))
            
    elif mood.lower() == "energetic":
        for _ in range(8):
            x1 = random.randint(0, 450)
            y1 = random.randint(0, 450)
            length = random.randint(80, 220)
            width = random.randint(2, 6)
            alpha = random.randint(80, 150)
            draw.line([x1, y1, x1 + length, y1 + length - 40], fill=(255, 255, 0, alpha), width=width)
            draw.line([x1 - 40, y1 + 50, x1 + length - 40, y1 + length + 10], fill=(255, 0, 128, alpha), width=width)

    # Composite base gradient + shapes
    cover = Image.alpha_composite(cover.convert("RGBA"), overlay)
    
    # Draw Typography
    draw_text = ImageDraw.Draw(cover)
    
    font_brand = get_font("SegoeUI-Bold.ttf", 14)
    draw_text.text((30, 30), "🎧 AlgoRythm Studio", fill=(255, 255, 255, 220), font=font_brand)
    
    font_title = get_font("SegoeUI-Bold.ttf", 36)
    font_mood = get_font("SegoeUI-Italic.ttf", 16)
    font_meta = get_font("SegoeUI.ttf", 12)
    
    title_text = song_title if len(song_title) <= 22 else song_title[:20] + "..."
    
    draw_text.text((32, 362), title_text, fill=(0, 0, 0, 100), font=font_title)
    draw_text.text((30, 360), title_text, fill=(255, 255, 255, 255), font=font_title)
    
    mood_text = f"// {mood.upper()} VIBE"
    draw_text.text((30, 405), mood_text, fill=(255, 255, 255, 180), font=font_mood)
    
    user_label = f"Composer: {user_email.split('@')[0]}"
    date_label = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    
    draw_text.text((30, 440), user_label, fill=(255, 255, 255, 140), font=font_meta)
    draw_text.text((30, 456), date_label, fill=(255, 255, 255, 140), font=font_meta)
    
    filename = f"cover_{mood}_{int(random.random() * 1000000)}.png"
    save_path = os.path.join(COVERS_DIR, filename)
    cover.convert("RGB").save(save_path, "PNG")
    
    return f"/covers/{filename}"
