import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import engine, SessionLocal, Base
from models.courses_models import Course, CourseModule, CourseLesson

MORPH_ZURI_COURSES = [
    {
        "slug": "3d-animation-masterclass",
        "name": "3D Animation & Character Rigging Masterclass",
        "category": "3D Animation",
        "level": "Beginner to Advanced",
        "duration": "12 Months",
        "fees": 65000,
        "emi": "₹5,416/mo",
        "thumbnail": "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80",
        "tag": "⭐ Flagship Studio Track",
        "short_desc": "Master 3D character animation, biped/quadruped rigging, lip-sync, acting, and Arnold rendering for films & AAA games.",
        "full_desc": "India's premier animation curriculum aligned with international studio standards. Learn character body mechanics, gesture drawing, quadruped locomotion, facial blendshapes, and realistic shading. Build a broadcast-ready graduation showreel reviewed by leading animation houses.",
        "tools": ["Autodesk Maya", "Blender", "ZBrush", "Substance 3D", "Arnold"],
        "outcomes": [
            "Create production-ready 3D character animations for movies & games",
            "Build realistic biped and quadruped rigs with custom UI controllers",
            "Master industry tools including Autodesk Maya, Blender, and ZBrush",
            "Produce a professional 60-second acting & action showreel",
            "100% Placement assistance with top animation studios",
        ],
        "requirements": [
            "No prior 3D software or coding experience needed",
            "Open to 10th/12th graduates and creative enthusiasts",
            "Dedicated practice time during studio lab hours",
        ],
        "career_roles": [
            {"role": "3D Character Animator", "avgSalary": "₹4.5L - ₹9.0L / yr"},
            {"role": "Rigging Technical Director (TD)", "avgSalary": "₹5.0L - ₹10.5L / yr"},
            {"role": "3D Generalist", "avgSalary": "₹4.0L - ₹7.5L / yr"},
        ],
        "status": "published",
        "modules": [
            {
                "title": "Module 01: Foundations of Art, Anatomy & Storyboarding",
                "description": "Gesture drawing, human anatomy, silhouette and storyboard thumbnailing.",
                "lessons": [
                    {"title": "Gesture Drawing & Silhouette Mastery", "duration": "45 Mins"},
                    {"title": "Human & Animal Skeletal Structure", "duration": "50 Mins"},
                    {"title": "Weight Distribution & Line of Action", "duration": "40 Mins"},
                ],
            },
            {
                "title": "Module 02: 3D Character Modeling & Sculpting",
                "description": "Polygon topology for animation, digital sculpting in ZBrush and PBR texturing.",
                "lessons": [
                    {"title": "Topology & Edge Loops for Animation", "duration": "60 Mins"},
                    {"title": "ZBrush High-Detail Organic Sculpting", "duration": "55 Mins"},
                    {"title": "Substance Painter Multi-Layer Texturing", "duration": "50 Mins"},
                ],
            },
            {
                "title": "Module 03: Advanced Character Rigging & Skinning",
                "description": "Biped & quadruped skeleton setup, IK/FK switching and skin weighting.",
                "lessons": [
                    {"title": "Biped Skeleton & Joint Orientation", "duration": "50 Mins"},
                    {"title": "Seamless IK/FK Switch Arm & Leg Rigs", "duration": "55 Mins"},
                    {"title": "Facial Blendshapes & Muscle Deformers", "duration": "60 Mins"},
                ],
            },
            {
                "title": "Module 04: Acting, Body Mechanics & Showreel Production",
                "description": "12 Principles of Animation, locomotion cycles, acting, lip-sync and studio portfolio.",
                "lessons": [
                    {"title": "Physics of Jumps, Pushes & Heavy Lifts", "duration": "55 Mins"},
                    {"title": "Dialogue Delivery & Phonetic Lip-Sync", "duration": "50 Mins"},
                    {"title": "Showreel Assembly, Lighting & Studio Placement", "duration": "60 Mins"},
                ],
            },
        ],
    },
    {
        "slug": "vfx-film-compositing",
        "name": "VFX Compositing & Film Post-Production",
        "category": "VFX",
        "level": "Intermediate",
        "duration": "10 Months",
        "fees": 58000,
        "emi": "₹4,833/mo",
        "thumbnail": "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=800&auto=format&fit=crop&q=80",
        "tag": "🎬 Hollywood Pipeline",
        "short_desc": "Node-based compositing in Nuke, green screen chroma keying, rotoscopy, matchmoving, and CGI integration.",
        "full_desc": "Become a high-demand visual effects compositor. Learn node-based workflows in Foundry Nuke, planar tracking in Mocha Pro, deep compositing, multi-pass CGI integration, wire removal, and cinematic color grading in DaVinci Resolve.",
        "tools": ["Foundry Nuke", "Adobe After Effects", "Mocha Pro", "Silhouette FX", "DaVinci Resolve"],
        "outcomes": [
            "Execute seamless multi-layer CGI integration into live-action plates",
            "Master advanced node-based compositing in Foundry Nuke",
            "Perform precision 3D camera tracking and projection mapping",
            "Deliver clean rotoscopy and green screen keying on complex hair/motion blur",
        ],
        "requirements": ["Basic computer literacy and visual aesthetics"],
        "career_roles": [
            {"role": "VFX Compositor (Nuke)", "avgSalary": "₹4.2L - ₹8.5L / yr"},
            {"role": "Paint & Roto Artist", "avgSalary": "₹3.2L - ₹5.5L / yr"},
            {"role": "Matchmove & Tracking TD", "avgSalary": "₹4.0L - ₹7.0L / yr"},
        ],
        "status": "published",
        "modules": [
            {
                "title": "Module 01: Digital Plate Prep & Clean-up",
                "description": "Wire removal, marker clean-up, and advanced clone painting.",
                "lessons": [
                    {"title": "Plate Prep Fundamentals in Nuke", "duration": "45 Mins"},
                    {"title": "Planar Tracking & Stabilisation in Mocha", "duration": "50 Mins"},
                ],
            },
            {
                "title": "Module 02: Advanced Chroma Keying & Spill Suppression",
                "description": "Core matte generation, IBK Colour / Keylight, edge refining and despill.",
                "lessons": [
                    {"title": "IBK Gizmo & Keylight Setup", "duration": "55 Mins"},
                    {"title": "Fine Hair Detail Extraction & Motion Blur Matting", "duration": "60 Mins"},
                ],
            },
            {
                "title": "Module 03: 3D Camera Projection & CGI Integration",
                "description": "CameraTracker, PointCloud, Relighting with Normal/Position passes.",
                "lessons": [
                    {"title": "Nuke 3D Workspace & Camera Solve", "duration": "55 Mins"},
                    {"title": "Multi-Channel AOV CG Beauty Pass Breakout", "duration": "60 Mins"},
                ],
            },
        ],
    },
    {
        "slug": "game-design-unreal",
        "name": "Game Design, Unreal Engine 5 & Metaverse",
        "category": "Game Design",
        "level": "All Levels",
        "duration": "8 Months",
        "fees": 52000,
        "emi": "₹4,333/mo",
        "thumbnail": "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80",
        "tag": "🎮 Next-Gen Engine Track",
        "short_desc": "Build playable AAA game levels, Blueprint visual scripting, Nanite & Lumen environments, and VR interactivity.",
        "full_desc": "Enter the fastest-growing gaming industry. Learn level design, gameplay mechanics, lighting, Niagara visual effects, sound design, and character AI in Unreal Engine 5. Build your own interactive 3D game demo for PC and VR headsets.",
        "tools": ["Unreal Engine 5", "Unity 3D", "Blender", "Quixel Megascans", "FMOD"],
        "outcomes": [
            "Design and build complete playable 3D games in Unreal Engine 5",
            "Write gameplay mechanics using Blueprint visual scripting without coding",
            "Harness real-time Lumen global illumination and Nanite virtualized geometry",
            "Publish your game demo to Steam and Epic Games Store formats",
        ],
        "requirements": ["Interest in video games and interactive 3D environments"],
        "career_roles": [
            {"role": "Unreal Engine Game Developer", "avgSalary": "₹5.0L - ₹10.0L / yr"},
            {"role": "3D Level & Environment Designer", "avgSalary": "₹4.5L - ₹8.0L / yr"},
            {"role": "Technical Artist (Realtime VFX)", "avgSalary": "₹6.0L - ₹12.0L / yr"},
        ],
        "status": "published",
        "modules": [
            {
                "title": "Module 01: UE5 Fundamentals & Level Design",
                "description": "Viewport navigation, landscape sculpting, water systems and Foliage tools.",
                "lessons": [
                    {"title": "UE5 Interface & Asset Management", "duration": "45 Mins"},
                    {"title": "Quixel Megascans & Nanite Integration", "duration": "50 Mins"},
                ],
            },
            {
                "title": "Module 02: Blueprint Visual Scripting & Mechanics",
                "description": "Character controllers, doors, triggers, inventory systems and enemy AI.",
                "lessons": [
                    {"title": "First-Person & Third-Person Controller Setup", "duration": "55 Mins"},
                    {"title": "Health, Stamina & Interactive UI Widget Blueprints", "duration": "50 Mins"},
                ],
            },
        ],
    },
    {
        "slug": "ui-ux-design-product",
        "name": "UI/UX Design & Digital Product Strategy",
        "category": "Graphic & UI/UX",
        "level": "Beginner to Advanced",
        "duration": "6 Months",
        "fees": 42000,
        "emi": "₹3,500/mo",
        "thumbnail": "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&auto=format&fit=crop&q=80",
        "tag": "📱 High Demand Tech Track",
        "short_desc": "User research, wireframing, interactive prototyping in Figma, design systems, and mobile app design.",
        "full_desc": "Design world-class digital experiences for mobile apps and web platforms. Learn user research, empathy mapping, information architecture, wireframing, high-fidelity UI design in Figma, auto-layout, micro-animations, and portfolio case studies.",
        "tools": ["Figma", "Adobe XD", "Miro", "Notion", "Protopie"],
        "outcomes": [
            "Conduct user research, personas, and usability testing",
            "Build scalable Design Systems and UI component libraries in Figma",
            "Create interactive clickable mobile and web prototypes",
            "Complete 3 end-to-end design case studies for your portfolio",
        ],
        "requirements": ["Curiosity about user behavior and mobile apps"],
        "career_roles": [
            {"role": "UI/UX Product Designer", "avgSalary": "₹5.0L - ₹9.5L / yr"},
            {"role": "User Experience Researcher", "avgSalary": "₹4.5L - ₹8.0L / yr"},
        ],
        "status": "published",
        "modules": [
            {
                "title": "Module 01: UX Research & User Journey Mapping",
                "description": "Problem discovery, stakeholder interviews, user persona and information architecture.",
                "lessons": [
                    {"title": "Qualitative & Quantitative User Research", "duration": "45 Mins"},
                    {"title": "Information Architecture & Card Sorting", "duration": "50 Mins"},
                ],
            },
            {
                "title": "Module 02: UI Design, Auto-Layout & Design Systems in Figma",
                "description": "Visual hierarchy, typography scales, color accessibility, components and variables.",
                "lessons": [
                    {"title": "Figma Auto-Layout 5.0 & Responsive Components", "duration": "60 Mins"},
                    {"title": "Building Production Design Systems & Tokens", "duration": "55 Mins"},
                ],
            },
        ],
    },
    {
        "slug": "graphic-design-branding",
        "name": "Graphic Design & Digital Brand Identity",
        "category": "Graphic & UI/UX",
        "level": "All Levels",
        "duration": "6 Months",
        "fees": 38000,
        "emi": "₹3,166/mo",
        "thumbnail": "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&auto=format&fit=crop&q=80",
        "tag": "🎨 Creative Branding Track",
        "short_desc": "Logo design, brand identity manuals, typography, social media ad creatives, and vector illustration.",
        "full_desc": "Master commercial graphic design and brand communication. Learn typography hierarchy, color psychology, vector illustration in Adobe Illustrator, photo manipulation in Photoshop, packaging design, and multi-page editorial layout in InDesign.",
        "tools": ["Adobe Photoshop", "Adobe Illustrator", "InDesign", "Canva Pro"],
        "outcomes": [
            "Design memorable brand logos, stationery, and visual identity guidelines",
            "Master advanced photo retouching and digital manipulation in Photoshop",
            "Create viral social media ad graphics and campaign posters",
        ],
        "requirements": ["Basic computer knowledge and passion for visual art"],
        "career_roles": [
            {"role": "Senior Brand Graphic Designer", "avgSalary": "₹3.8L - ₹7.0L / yr"},
            {"role": "Visual Content Creator", "avgSalary": "₹3.5L - ₹6.0L / yr"},
        ],
        "status": "published",
        "modules": [
            {
                "title": "Module 01: Vector Art & Brand Logo Design",
                "description": "Pen tool mastery, geometric construction, negative space logos and brand assets.",
                "lessons": [
                    {"title": "Illustrator Vector Mechanics & Golden Ratio Logos", "duration": "50 Mins"},
                    {"title": "Brand Guidelines & Corporate Identity Kits", "duration": "45 Mins"},
                ],
            },
        ],
    },
    {
        "slug": "motion-graphics-broadcast",
        "name": "Motion Graphics & Title Design",
        "category": "Motion Graphics",
        "level": "Beginner to Pro",
        "duration": "6 Months",
        "fees": 40000,
        "emi": "₹3,333/mo",
        "thumbnail": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80",
        "tag": "⚡ Fast-Track Career",
        "short_desc": "Kinetic typography, 3D broadcast packages, logo stings, infographic animation, and social media reels.",
        "full_desc": "Create eye-catching motion design for brands, OTT title sequences, advertising agencies, and YouTube creators. Master speed graph easing, shape layer morphing, 3D camera tracking, and Redshift GPU rendering.",
        "tools": ["After Effects", "Cinema 4D", "Illustrator", "Photoshop", "Redshift"],
        "outcomes": [
            "Create high-energy 2D & 3D motion graphics for advertising & broadcast",
            "Animate complex kinetic typography with audio synchronization",
            "Build reusable broadcast graphic templates (MOGRTs)",
            "Develop a commercial design portfolio attracting freelance clients",
        ],
        "requirements": ["Basic computer knowledge and enthusiasm for design"],
        "career_roles": [
            {"role": "Motion Graphics Artist", "avgSalary": "₹3.8L - ₹7.2L / yr"},
            {"role": "Broadcast Packaging Designer", "avgSalary": "₹4.5L - ₹8.5L / yr"},
        ],
        "status": "published",
        "modules": [
            {
                "title": "Module 01: 2D Animation & Speed Graph Mastery",
                "description": "Keyframing, bezier handles, easing curves and secondary motion.",
                "lessons": [
                    {"title": "Speed Graph & Value Graph Deep-Dive", "duration": "45 Mins"},
                    {"title": "Shape Layer Morphing & Liquid Transitions", "duration": "50 Mins"},
                ],
            },
        ],
    },
    {
        "slug": "photography-cinematography",
        "name": "Photography & Cinematic Filmmaking",
        "category": "Filmmaking",
        "level": "All Levels",
        "duration": "6 Months",
        "fees": 45000,
        "emi": "₹3,750/mo",
        "thumbnail": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80",
        "tag": "🎥 Studio Lab Practical Track",
        "short_desc": "DSLR/Cinema camera handling, 3-point studio lighting, gimbal operation, outdoor cinematography, and DaVinci color grading.",
        "full_desc": "Hands-on studio filmmaking training. Learn exposure triangle, framing, lens optics, studio strobe lighting, outdoor cinematography, audio recording, camera movement, and film editing with DaVinci Resolve color grading.",
        "tools": ["Sony FX3 / Canon Cinema", "DaVinci Resolve", "Studio Strobe Lights", "Gimbals", "Rode Wireless Audio"],
        "outcomes": [
            "Operate professional mirrorless and cinema cameras with confidence",
            "Set up multi-light studio setups for portraits, commercial ads, and interviews",
            "Color grade footage using node-based workflows in DaVinci Resolve",
            "Shoot and direct short films, music videos, and fashion shoots",
        ],
        "requirements": ["Enthusiasm for cameras, storytelling, and visual capture"],
        "career_roles": [
            {"role": "Cinematographer / Director of Photography", "avgSalary": "₹4.5L - ₹9.0L / yr"},
            {"role": "Commercial Studio Photographer", "avgSalary": "₹3.5L - ₹6.5L / yr"},
        ],
        "status": "published",
        "modules": [
            {
                "title": "Module 01: Camera Mechanics, Optics & Exposure",
                "description": "Shutter speed, aperture, ISO, dynamic range, RAW video formats, and lens selection.",
                "lessons": [
                    {"title": "Understanding Log Profiles & Dynamic Range", "duration": "45 Mins"},
                    {"title": "Lenses, Depth of Field & Focal Length Choice", "duration": "50 Mins"},
                ],
            },
        ],
    },
    {
        "slug": "fashion-design-cad",
        "name": "Fashion Designing & 3D Garment CAD",
        "category": "Fashion Designing",
        "level": "Beginner to Advanced",
        "duration": "12 Months",
        "fees": 55000,
        "emi": "₹4,583/mo",
        "thumbnail": "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&auto=format&fit=crop&q=80",
        "tag": "👗 Runway & Digital CAD",
        "short_desc": "Pattern making, garment construction, fashion illustration, Clo3D digital garment creation, and runway portfolio.",
        "full_desc": "Master both traditional pattern drafting and modern 3D digital garment design in Clo3D. Learn fabric selection, draping, fashion sketch illustration, garment assembly, digital runway shows, and brand collection development.",
        "tools": ["Clo3D", "Adobe Illustrator Fashion", "Photoshop", "Pattern CAD"],
        "outcomes": [
            "Draft precision garment patterns from body measurements",
            "Simulate realistic 3D clothing and digital fashion in Clo3D",
            "Create runway fashion collections for retail and couture brands",
        ],
        "requirements": ["Interest in style, clothing, and fashion design"],
        "career_roles": [
            {"role": "Fashion Designer / Apparel CAD Specialist", "avgSalary": "₹4.0L - ₹8.0L / yr"},
            {"role": "3D Digital Fashion Artist", "avgSalary": "₹5.0L - ₹10.0L / yr"},
        ],
        "status": "published",
        "modules": [
            {
                "title": "Module 01: Fashion Sketching & Pattern Drafting",
                "description": "Figure proportion, croquis sketching, bodice blocks, and seam allowances.",
                "lessons": [
                    {"title": "Croquis Drawing & Silhouette Rendering", "duration": "50 Mins"},
                    {"title": "Basic Bodice & Skirt Block Pattern Drafting", "duration": "60 Mins"},
                ],
            },
        ],
    },
    {
        "slug": "digital-marketing-ai",
        "name": "Digital Marketing & AI Growth Hacking",
        "category": "Digital Marketing",
        "level": "All Levels",
        "duration": "4 Months",
        "fees": 30000,
        "emi": "₹2,500/mo",
        "thumbnail": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80",
        "tag": "🚀 Growth & Performance Track",
        "short_desc": "SEO, Google Ads, Meta Ads (Facebook/Instagram), AI content generation, analytics, and e-commerce scaling.",
        "full_desc": "Learn actionable digital marketing strategies that generate revenue. Master search engine optimization, Google Ads PPC, Meta Ads Manager, high-converting funnel design, email marketing automation, Google Analytics 4, and AI copy generation with ChatGPT.",
        "tools": ["Google Ads", "Meta Ads Manager", "GA4", "SEMrush", "Canva Pro", "ChatGPT"],
        "outcomes": [
            "Run profitable paid ad campaigns on Google Search & Meta",
            "Rank websites on Google top page using technical and on-page SEO",
            "Automate marketing funnels and track conversion ROAS",
        ],
        "requirements": ["Basic internet literacy and curiosity about online business"],
        "career_roles": [
            {"role": "Digital Marketing Manager", "avgSalary": "₹4.2L - ₹8.5L / yr"},
            {"role": "Performance Marketing Lead", "avgSalary": "₹5.0L - ₹10.0L / yr"},
        ],
        "status": "published",
        "modules": [
            {
                "title": "Module 01: Search Engine Optimization & Content Strategy",
                "description": "Keyword research, technical audits, on-page SEO, and backlink strategies.",
                "lessons": [
                    {"title": "High-Intent Keyword Discovery & Mapping", "duration": "45 Mins"},
                    {"title": "On-Page SEO Optimization & Schema Markup", "duration": "50 Mins"},
                ],
            },
        ],
    },
    {
        "slug": "full-stack-web-dev",
        "name": "Full Stack Web & Mobile App Development",
        "category": "Web Development",
        "level": "Beginner to Advanced",
        "duration": "8 Months",
        "fees": 48000,
        "emi": "₹4,000/mo",
        "thumbnail": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80",
        "tag": "💻 Modern Stack Track",
        "short_desc": "React, React Native, Python FastAPI, PostgreSQL, REST APIs, Git, and cloud deployment on AWS & Vercel.",
        "full_desc": "Become a full stack software engineer capable of building real-world web and mobile applications. Learn HTML5, CSS3, modern JavaScript ES6+, React, React Native cross-platform mobile apps, Python FastAPI backend, PostgreSQL relational databases, JWT authentication, and DevOps deployment.",
        "tools": ["React", "React Native", "FastAPI", "PostgreSQL", "Tailwind CSS", "Git & GitHub"],
        "outcomes": [
            "Build full-stack web applications with React frontend and FastAPI backend",
            "Create iOS and Android mobile apps with React Native",
            "Design robust PostgreSQL relational databases and secure JWT auth systems",
            "Deploy production web applications to cloud servers",
        ],
        "requirements": ["Basic computer usage and problem-solving mindset (no prior coding required)"],
        "career_roles": [
            {"role": "Full Stack Software Developer", "avgSalary": "₹5.5L - ₹11.0L / yr"},
            {"role": "Frontend / React Engineer", "avgSalary": "₹4.5L - ₹8.5L / yr"},
        ],
        "status": "published",
        "modules": [
            {
                "title": "Module 01: Modern Frontend Development with React",
                "description": "Component architecture, State management, Hooks, Tailwind styling, and REST API integration.",
                "lessons": [
                    {"title": "React Component Lifecycles & Custom Hooks", "duration": "50 Mins"},
                    {"title": "State Management & REST API Data Fetching", "duration": "55 Mins"},
                ],
            },
            {
                "title": "Module 02: Python Backend, FastAPI & PostgreSQL",
                "description": "REST API design, SQLAlchemy ORM, database migrations, and JWT auth guards.",
                "lessons": [
                    {"title": "Building High-Speed REST APIs in FastAPI", "duration": "55 Mins"},
                    {"title": "PostgreSQL Relational Modeling & Authentication", "duration": "60 Mins"},
                ],
            },
        ],
    },
]

def seed_all_morph_zuri_courses():
    print("==========================================================")
    print("  SEEDING 10 AUTHENTIC MORPH & ZURI ACADEMY COURSES       ")
    print("==========================================================")

    db = SessionLocal()

    for c_data in MORPH_ZURI_COURSES:
        existing = db.query(Course).filter((Course.slug == c_data["slug"]) | (Course.name == c_data["name"])).first()
        if not existing:
            course = Course(
                slug=c_data["slug"],
                name=c_data["name"],
                category=c_data["category"],
                level=c_data["level"],
                duration=c_data["duration"],
                fees=c_data["fees"],
                emi=c_data["emi"],
                thumbnail=c_data["thumbnail"],
                tag=c_data["tag"],
                short_desc=c_data["short_desc"],
                full_desc=c_data["full_desc"],
                tools=c_data["tools"],
                outcomes=c_data["outcomes"],
                requirements=c_data["requirements"],
                career_roles=c_data["career_roles"],
                status=c_data["status"],
            )
            db.add(course)
            db.commit()
            db.refresh(course)
            print(f"[CREATED] {course.name} (#{course.id})")
            target_course = course
        else:
            existing.slug = c_data["slug"]
            existing.category = c_data["category"]
            existing.level = c_data["level"]
            existing.duration = c_data["duration"]
            existing.fees = c_data["fees"]
            existing.emi = c_data["emi"]
            existing.status = "published"
            existing.thumbnail = c_data["thumbnail"]
            existing.tag = c_data["tag"]
            existing.short_desc = c_data["short_desc"]
            existing.full_desc = c_data["full_desc"]
            existing.tools = c_data["tools"]
            existing.outcomes = c_data["outcomes"]
            existing.requirements = c_data["requirements"]
            existing.career_roles = c_data["career_roles"]
            db.commit()
            db.refresh(existing)
            print(f"[UPDATED] {existing.name} (#{existing.id})")
            target_course = existing

        # Ensure modules & lessons
        db.query(CourseModule).filter(CourseModule.course_id == target_course.id).delete()
        db.commit()

        for mod_idx, m_data in enumerate(c_data.get("modules", []), start=1):
            module = CourseModule(
                course_id=target_course.id,
                title=m_data["title"],
                order_index=mod_idx,
                description=m_data.get("description"),
            )
            db.add(module)
            db.commit()
            db.refresh(module)

            for les_idx, l_data in enumerate(m_data.get("lessons", []), start=1):
                lesson = CourseLesson(
                    module_id=module.id,
                    title=l_data["title"],
                    order_index=les_idx,
                    duration=l_data.get("duration", "45 Mins"),
                )
                db.add(lesson)
            db.commit()

    db.close()
    print("==========================================================")
    print("  ALL 10 COURSES & CURRICULUM SEEDED TO NEON DB (100% OK) ")
    print("==========================================================")

if __name__ == "__main__":
    seed_all_morph_zuri_courses()
