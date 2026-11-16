import io
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN
from typing import Dict, Any

# --- Gamma-Like Color Palette ---
BG_COLOR = RGBColor(248, 250, 252)       # Slate 50
ACCENT_COLOR = RGBColor(79, 70, 229)     # Indigo 600
DARK_TEXT = RGBColor(30, 41, 59)         # Slate 800
MUTED_TEXT = RGBColor(100, 116, 139)     # Slate 500
WHITE = RGBColor(255, 255, 255)

def add_background(slide, prs_width, prs_height, r=248, g=250, b=252):
    """Adds a solid background rectangle to a slide."""
    bg_shape = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, 0, 0, prs_width, prs_height
    )
    bg_shape.fill.solid()
    bg_shape.fill.fore_color.rgb = RGBColor(r, g, b)
    bg_shape.line.fill.background()
    # Move to back (python-pptx doesn't have z-order API, so we add it first)

def add_title(slide, text, top=Inches(0.5)):
    txBox = slide.shapes.add_textbox(Inches(0.5), top, Inches(9), Inches(1))
    tf = txBox.text_frame
    p = tf.add_paragraph()
    p.text = text
    p.font.bold = True
    p.font.size = Pt(32)
    p.font.color.rgb = DARK_TEXT
    return txBox

def add_content_box(slide, left, top, width, height, bg_color=WHITE):
    shape = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height
    )
    shape.fill.solid()
    shape.fill.fore_color.rgb = bg_color
    shape.line.fill.background()
    return shape

def generate_pptx(report_data: Dict[str, Any]) -> io.BytesIO:
    prs = Presentation()
    # Widescreen 16:9
    prs.slide_width = Inches(10)
    prs.slide_height = Inches(5.625)
    
    raw_data = report_data.get("raw_data", {})
    insights = report_data.get("ai_insights", {})
    custom_slides = report_data.get("custom_slides", [])
    
    dataset_type = raw_data.get("dataset_type", "general").upper()
    title_text = "BUSINESS ANALYTICS REPORT" if dataset_type == "BUSINESS" else "DATA SCIENCE REPORT"
    
    # ---------------------------------------------------------
    # Slide 1: Cover
    # ---------------------------------------------------------
    slide = prs.slides.add_slide(prs.slide_layouts[6]) # Blank layout
    add_background(slide, prs.slide_width, prs.slide_height, 248, 250, 252)
    
    # Accent Banner
    banner = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, Inches(2), prs.slide_width, Inches(1.8))
    banner.fill.solid()
    banner.fill.fore_color.rgb = ACCENT_COLOR
    banner.line.fill.background()
    
    txBox = slide.shapes.add_textbox(Inches(1), Inches(2.3), Inches(8), Inches(1))
    tf = txBox.text_frame
    p = tf.add_paragraph()
    p.text = "DataLens AI"
    p.font.bold = True
    p.font.size = Pt(44)
    p.font.color.rgb = WHITE
    p.alignment = PP_ALIGN.CENTER
    
    txBox2 = slide.shapes.add_textbox(Inches(1), Inches(3.9), Inches(8), Inches(1))
    tf2 = txBox2.text_frame
    p2 = tf2.add_paragraph()
    p2.text = f"{title_text}\nAutomatically Generated"
    p2.font.size = Pt(18)
    p2.font.color.rgb = MUTED_TEXT
    p2.alignment = PP_ALIGN.CENTER
    
    # ---------------------------------------------------------
    # Slide 2: Executive Summary
    # ---------------------------------------------------------
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_background(slide, prs.slide_width, prs.slide_height)
    add_title(slide, "Executive Summary")
    
    # White card for content
    add_content_box(slide, Inches(0.5), Inches(1.5), Inches(9), Inches(3.5))
    
    txBox = slide.shapes.add_textbox(Inches(0.8), Inches(1.8), Inches(8.4), Inches(2.9))
    tf = txBox.text_frame
    tf.word_wrap = True
    p = tf.add_paragraph()
    p.text = insights.get("executive_summary", "")
    p.font.size = Pt(18)
    p.font.color.rgb = DARK_TEXT

    # ---------------------------------------------------------
    # Slide 3: KPIs
    # ---------------------------------------------------------
    kpis = raw_data.get("kpis", [])
    if kpis:
        slide = prs.slides.add_slide(prs.slide_layouts[6])
        add_background(slide, prs.slide_width, prs.slide_height)
        add_title(slide, "Key Performance Indicators")
        
        left_margin = 0.5
        top_margin = 1.5
        box_width = 2.8
        box_height = 1.6
        
        for i, kpi in enumerate(kpis):
            col = i % 3
            row = i // 3
            
            x = Inches(left_margin + col * (box_width + 0.2))
            y = Inches(top_margin + row * (box_height + 0.2))
            
            add_content_box(slide, x, y, Inches(box_width), Inches(box_height))
            
            txBox = slide.shapes.add_textbox(x, y, Inches(box_width), Inches(box_height))
            tf = txBox.text_frame
            tf.word_wrap = True
            
            # KPI Value
            p_val = tf.add_paragraph()
            p_val.text = str(kpi["value"])
            p_val.font.bold = True
            p_val.font.size = Pt(28)
            p_val.font.color.rgb = ACCENT_COLOR
            p_val.alignment = PP_ALIGN.CENTER
            
            # KPI Name
            p_name = tf.add_paragraph()
            p_name.text = str(kpi["name"]).upper()
            p_name.font.size = Pt(11)
            p_name.font.bold = True
            p_name.font.color.rgb = MUTED_TEXT
            p_name.alignment = PP_ALIGN.CENTER

    # ---------------------------------------------------------
    # Charts (Images)
    # ---------------------------------------------------------
    charts = raw_data.get("charts", [])
    if charts:
        import tempfile
        import os
        from app.tools.chart_renderer import render_chart_to_bytes
        
        for chart in charts:
            try:
                img_bytes = render_chart_to_bytes(chart)
                if img_bytes:
                    with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp:
                        tmp.write(img_bytes.read())
                        tmp_path = tmp.name
                        
                    slide = prs.slides.add_slide(prs.slide_layouts[6])
                    add_background(slide, prs.slide_width, prs.slide_height)
                    add_title(slide, str(chart.get("title", "Data Visualization")).upper())
                    
                    # Add chart image perfectly centered and scaled
                    slide.shapes.add_picture(tmp_path, Inches(1.2), Inches(1.7), width=Inches(7.6))
                    os.unlink(tmp_path)
            except Exception as e:
                print(f"Failed to render chart for PPT: {e}")

    # ---------------------------------------------------------
    # Slide X: Key Findings
    # ---------------------------------------------------------
    findings = insights.get("key_findings", [])
    if findings:
        slide = prs.slides.add_slide(prs.slide_layouts[6])
        add_background(slide, prs.slide_width, prs.slide_height)
        add_title(slide, "Key Findings")
        
        add_content_box(slide, Inches(0.5), Inches(1.5), Inches(9), Inches(3.5))
        txBox = slide.shapes.add_textbox(Inches(0.8), Inches(1.8), Inches(8.4), Inches(2.9))
        tf = txBox.text_frame
        tf.word_wrap = True
        
        for f in findings:
            p = tf.add_paragraph()
            p.text = f"•  {f}"
            p.font.size = Pt(16)
            p.font.color.rgb = DARK_TEXT
            p.space_after = Pt(12)
            
    # ---------------------------------------------------------
    # Custom Slides (From Chat)
    # ---------------------------------------------------------
    for c_slide in custom_slides:
        slide = prs.slides.add_slide(prs.slide_layouts[6])
        add_background(slide, prs.slide_width, prs.slide_height)
        add_title(slide, c_slide.get("title", "Custom Insight"))
        
        add_content_box(slide, Inches(0.5), Inches(1.5), Inches(9), Inches(3.5))
        txBox = slide.shapes.add_textbox(Inches(0.8), Inches(1.8), Inches(8.4), Inches(2.9))
        tf = txBox.text_frame
        tf.word_wrap = True
        
        content = c_slide.get("content", "")
        if isinstance(content, list):
            for point in content:
                p = tf.add_paragraph()
                p.text = f"•  {point}"
                p.font.size = Pt(16)
                p.font.color.rgb = DARK_TEXT
                p.space_after = Pt(12)
        else:
            p = tf.add_paragraph()
            p.text = str(content)
            p.font.size = Pt(16)
            p.font.color.rgb = DARK_TEXT

    ppt_io = io.BytesIO()
    prs.save(ppt_io)
    ppt_io.seek(0)
    return ppt_io
