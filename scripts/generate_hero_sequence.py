import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import cv2
import numpy as np

def ease_out_cubic(t):
    return 1.0 - math.pow(1.0 - t, 3)

def ease_in_out_cubic(t):
    if t < 0.5:
        return 4.0 * t * t * t
    else:
        return 1.0 - math.pow(-2.0 * t + 2.0, 3) / 2.0

def ease_out_quad(t):
    return 1.0 - (1.0 - t) * (1.0 - t)

def clamp(val, min_v=0.0, max_v=1.0):
    return max(min_v, min(max_v, val))

def main():
    W, H = 1920, 1080
    TOTAL_FRAMES = 114
    FPS = 30

    output_dir = 'public/images/herosection2'
    os.makedirs(output_dir, exist_ok=True)

    # Fonts
    font_title = ImageFont.truetype('Outfit-VariableFont.ttf', 108)
    font_title.set_variation_by_axes([850])

    font_brand = ImageFont.truetype('Outfit-VariableFont.ttf', 144)
    font_brand.set_variation_by_axes([850])

    font_body = ImageFont.truetype('Inter-VariableFont.ttf', 23)
    font_body.set_variation_by_axes([24, 450])

    font_btn = ImageFont.truetype('Outfit-VariableFont.ttf', 20)
    font_btn.set_variation_by_axes([650])

    # Load Boat
    boat_raw = Image.open('public/assets/kochi-water-metro-boat-profile.png').convert('RGBA')
    bw = 980
    bh = int(boat_raw.height * (bw / boat_raw.width))
    boat_scaled = boat_raw.resize((bw, bh), Image.Resampling.LANCZOS)

    # Pre-render Shadow
    shadow_raw = Image.new('RGBA', (bw + 80, 80), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow_raw)
    sdraw.ellipse([30, 15, bw + 50, 60], fill=(0, 25, 45, 55))
    shadow_raw = shadow_raw.filter(ImageFilter.GaussianBlur(14))

    # Pre-render Water Reflection Ripple
    ripple_raw = Image.new('RGBA', (bw + 140, 90), (0, 0, 0, 0))
    rdraw = ImageDraw.Draw(ripple_raw)
    rdraw.ellipse([20, 20, bw + 110, 70], fill=(0, 153, 153, 38))
    rdraw.ellipse([50, 28, bw + 80, 60], fill=(56, 189, 248, 30))
    ripple_raw = ripple_raw.filter(ImageFilter.GaussianBlur(12))

    # Mouse cursor
    cursor_size = 32
    cursor_img = Image.new('RGBA', (cursor_size, cursor_size), (0, 0, 0, 0))
    cdraw = ImageDraw.Draw(cursor_img)
    poly = [(2, 2), (2, 24), (7, 19), (12, 28), (16, 26), (11, 17), (19, 17)]
    cdraw.polygon(poly, fill=(15, 23, 42, 255), outline=(255, 255, 255, 255))

    # Video Writer
    video_path = os.path.join(output_dir, 'hero-animation.mp4')
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    video_writer = cv2.VideoWriter(video_path, fourcc, FPS, (W, H))

    print(f"Rendering {TOTAL_FRAMES} frames...")

    for f in range(TOTAL_FRAMES):
        t = f / (TOTAL_FRAMES - 1)  # 0.0 to 1.0
        sec = f / FPS

        # Create Canvas: clean soft ambient background
        canvas = Image.new('RGBA', (W, H), (242, 248, 253, 255))

        # Card container with soft rounded corners and subtle shadow
        card = Image.new('RGBA', (W - 80, H - 80), (255, 255, 255, 255))
        mask = Image.new('L', (W - 80, H - 80), 0)
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.rounded_rectangle([0, 0, W - 80, H - 80], radius=28, fill=255)
        canvas.paste(card, (40, 40), mask)

        # Subtle card border
        card_draw = ImageDraw.Draw(canvas)
        card_draw.rounded_rectangle([40, 40, W - 40, H - 40], radius=28, outline=(215, 235, 248, 255), width=2)

        # 1. Decorative indicator dots
        dot_progress = clamp(sec / 0.4)
        dot_alpha = int(dot_progress * 255)
        card_draw.ellipse([90, 85, 106, 101], fill=(0, 153, 153, dot_alpha))
        card_draw.ellipse([118, 85, 134, 101], fill=(203, 213, 225, dot_alpha))

        # 2. "CONNECTING" - fades and slides in from left (0s to 0.75s)
        # Position: base x: 90, base y: 140
        connect_t = clamp(sec / 0.75)
        connect_ease = ease_out_cubic(connect_t)
        connect_x = 90 - int((1.0 - connect_ease) * 70)
        connect_alpha = int(connect_ease * 255)

        # Cursor hover scale on "CONNECTING" during sec: 1.8s to 2.4s
        is_hovered = (1.8 <= sec <= 2.4)
        if is_hovered:
            hover_sub_t = math.sin((sec - 1.8) / 0.6 * math.pi)
            connect_fill = (
                int(15 + hover_sub_t * 10),
                int(23 + hover_sub_t * 80),
                int(42 + hover_sub_t * 90),
                connect_alpha
            )
        else:
            connect_fill = (15, 23, 42, connect_alpha)

        if connect_alpha > 0:
            card_draw.text((connect_x, 140), 'CONNECTING', fill=connect_fill, font=font_title)

        # 3. "Kochi" - slides up from y: 310 -> 260 and fades in (0.4s to 1.1s)
        kochi_t = clamp((sec - 0.4) / 0.7)
        kochi_ease = ease_out_cubic(kochi_t)
        kochi_y = 260 + int((1.0 - kochi_ease) * 45)
        kochi_alpha = int(kochi_ease * 255)

        if kochi_alpha > 0:
            kx = 90
            ky = kochi_y
            teal_color = (0, 153, 153, kochi_alpha)

            # 'K'
            card_draw.text((kx, ky), 'K', fill=teal_color, font=font_brand)
            bbox_k = font_brand.getbbox('K')
            k_w = bbox_k[2] - bbox_k[0]

            # 'o' container badge
            ox = kx + k_w + 14
            badge_size = 118
            badge_y = ky + 34
            card_draw.rounded_rectangle(
                [ox, badge_y, ox + badge_size, badge_y + badge_size],
                radius=26,
                fill=teal_color
            )

            # Official symbol inside badge
            sw = 8
            bx = ox + 18
            by_sym = badge_y + 26
            white_sym = (255, 255, 255, kochi_alpha)
            # Left wave
            card_draw.line([(bx + 8, by_sym + 12), (bx + 8, by_sym + 42)], fill=white_sym, width=sw)
            card_draw.line([(bx + 8, by_sym + 42), (bx + 40, by_sym + 12)], fill=white_sym, width=sw)
            card_draw.line([(bx + 40, by_sym + 12), (bx + 72, by_sym + 44)], fill=white_sym, width=sw)
            # Right wave
            card_draw.line([(bx + 30, by_sym + 36), (bx + 40, by_sym + 48)], fill=white_sym, width=sw)
            card_draw.line([(bx + 40, by_sym + 48), (bx + 72, by_sym + 12)], fill=white_sym, width=sw)

            # 'chi'
            chix = ox + badge_size + 16
            card_draw.text((chix, ky), 'chi', fill=teal_color, font=font_brand)

        # 4. Tagline - fades in (0.9s to 1.6s)
        tag_t = clamp((sec - 0.9) / 0.7)
        tag_alpha = int(ease_out_cubic(tag_t) * 255)
        if tag_alpha > 0:
            lines = [
                'Connecting people, places, and possibilities across Kochi through a seamless',
                'network of Metro Rail, Water Metro, and feeder services making every',
                'journey faster, greener, and more convenient.'
            ]
            ty = 450
            for line in lines:
                card_draw.text((90, ty), line, fill=(71, 85, 105, tag_alpha), font=font_body)
                ty += 38

        # 5. Buttons - pop in with spring/ease-out (1.3s to 1.9s)
        btn_t = clamp((sec - 1.3) / 0.6)
        btn_ease = ease_out_cubic(btn_t)
        btn_alpha = int(btn_ease * 255)
        by_btn = 610 + int((1.0 - btn_ease) * 20)

        if btn_alpha > 0:
            # Solid 'Book tickets'
            card_draw.rounded_rectangle(
                [90, by_btn, 90 + 200, by_btn + 58],
                radius=29,
                fill=(0, 153, 153, btn_alpha)
            )
            card_draw.text((126, by_btn + 16), 'Book tickets', fill=(255, 255, 255, btn_alpha), font=font_btn)

            # Outlined 'Plan your journey'
            card_draw.rounded_rectangle(
                [310, by_btn, 310 + 240, by_btn + 58],
                radius=29,
                outline=(0, 153, 153, btn_alpha),
                width=2
            )
            card_draw.text((342, by_btn + 16), 'Plan your journey', fill=(0, 153, 153, btn_alpha), font=font_btn)

        # 6. Catamaran Ferry - slides in from right edge and settles (0.1s to 2.2s)
        # Target position: x = 840, y = 480
        # Start position: x = 1950 (fully offscreen right)
        boat_t = clamp((sec - 0.1) / 2.1)
        boat_ease = ease_out_cubic(boat_t)
        boat_x = int(1950 - boat_ease * (1950 - 840))

        # Gentle resting water bob (idle floating effect after settling)
        if sec > 2.0:
            idle_t = sec - 2.0
            bob_offset = math.sin(idle_t * 2.8) * 3.0
            ripple_scale = 1.0 + 0.05 * math.cos(idle_t * 2.8)
        else:
            bob_offset = 0.0
            ripple_scale = 1.0

        boat_y = int(480 + bob_offset)

        # Shadow and Ripple opacity rises as boat settles
        boat_opacity = clamp(boat_ease * 1.5)
        if boat_opacity > 0:
            # Water Ripple
            r_w = int(ripple_raw.width * ripple_scale)
            r_h = int(ripple_raw.height * ripple_scale)
            cur_ripple = ripple_raw.resize((r_w, r_h), Image.Resampling.BILINEAR)
            rx = boat_x - 60 + int((ripple_raw.width - r_w) / 2)
            ry = boat_y + bh - 45 + int((ripple_raw.height - r_h) / 2)
            canvas.paste(cur_ripple, (rx, ry), cur_ripple)

            # Boat Shadow
            canvas.paste(shadow_raw, (boat_x - 40, boat_y + bh - 35), shadow_raw)

            # Boat
            canvas.paste(boat_scaled, (boat_x, boat_y), boat_scaled)

        # 7. Mouse cursor animation (1.5s to 2.8s)
        if 1.5 <= sec <= 2.8:
            cur_t = (sec - 1.5) / 1.3
            if cur_t < 0.4:
                # Gliding towards "CONNECTING"
                p = ease_out_cubic(cur_t / 0.4)
                cur_x = int(420 + p * (240 - 420))
                cur_y = int(320 + p * (180 - 320))
            elif cur_t < 0.7:
                # Hovering over "CONNECTING"
                cur_x = 240
                cur_y = 180
            else:
                # Gliding away
                p = ease_in_out_cubic((cur_t - 0.7) / 0.3)
                cur_x = int(240 + p * (120 - 240))
                cur_y = int(180 + p * (80 - 180))

            canvas.paste(cursor_img, (cur_x, cur_y), cursor_img)

        # Convert to RGB for saving
        final_rgb = Image.new('RGB', (W, H), (255, 255, 255))
        final_rgb.paste(canvas, mask=canvas.split()[3])

        # Save PNG and WebP
        frame_num = str(f + 1).padStart(3, '0') if hasattr(str, 'padStart') else f"{f + 1:03d}"
        png_path = os.path.join(output_dir, f"ezgif-frame-{frame_num}.png")
        webp_path = os.path.join(output_dir, f"ezgif-frame-{frame_num}.webp")

        final_rgb.save(png_path, format='PNG', optimize=True)
        final_rgb.save(webp_path, format='WEBP', quality=88)

        # Write to MP4 video (OpenCV expects BGR)
        cv_img = cv2.cvtColor(np.array(final_rgb), cv2.COLOR_RGB2BGR)
        video_writer.write(cv_img)

        if (f + 1) % 20 == 0 or f == TOTAL_FRAMES - 1:
            print(f"Generated frame {f + 1}/{TOTAL_FRAMES}")

    video_writer.release()
    print(f"Video saved to {video_path}!")
    print(f"Done! {TOTAL_FRAMES} frames generated in {output_dir}")

if __name__ == '__main__':
    main()
