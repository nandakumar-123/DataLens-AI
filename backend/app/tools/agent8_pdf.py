import io
import tempfile
import os
from fpdf import FPDF
from typing import Dict, Any

class ReportPDF(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 15)
        self.cell(0, 10, 'DataLens AI Report', 0, 1, 'C')
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

def clean_text(text: Any) -> str:
    if not isinstance(text, str):
        text = str(text)
    text = text.encode('latin-1', 'replace').decode('latin-1')
    
    # Break only extremely long words with a space, so fpdf2 can wrap it
    lines = text.split("\n")
    safe_lines = []
    for line in lines:
        words = line.split(" ")
        safe_words = []
        for w in words:
            if len(w) > 40:
                chunks = [w[i:i+40] for i in range(0, len(w), 40)]
                safe_words.append(" ".join(chunks))
            else:
                safe_words.append(w)
        safe_lines.append(" ".join(safe_words))
        
    return "\n".join(safe_lines)

def generate_pdf(report_data: Dict[str, Any]) -> io.BytesIO:
    pdf = ReportPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)

    raw_data = report_data.get("raw_data", {})
    insights = report_data.get("ai_insights", {})
    charts = raw_data.get("charts", [])
    
    dataset_type = raw_data.get("dataset_type", "general").upper()
    
    # Title
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(0, 10, f"{clean_text(dataset_type)} REPORT", 0, 1, 'C')
    pdf.ln(10)
    
    # Executive Summary
    pdf.set_font("Arial", 'B', 14)
    pdf.cell(0, 10, "Executive Summary", 0, 1)
    pdf.set_font("Arial", size=12)
    pdf.multi_cell(0, 8, clean_text(insights.get("executive_summary", "")))
    pdf.ln(10)
    
    # KPIs
    kpis = raw_data.get("kpis", [])
    if kpis:
        pdf.set_font("Arial", 'B', 14)
        pdf.cell(0, 10, "Key Performance Indicators", 0, 1)
        pdf.set_font("Arial", size=12)
        for kpi in kpis:
            pdf.cell(80, 8, f"{clean_text(kpi['name'])}:", border=1)
            pdf.cell(80, 8, f"{clean_text(kpi['value'])}", border=1, ln=1)
        pdf.ln(10)
        
    # Charts
    if charts:
        try:
            from app.tools.chart_renderer import render_chart_to_bytes
            pdf.add_page()
            pdf.set_font("Arial", 'B', 14)
            pdf.cell(0, 10, "Data Visualizations", 0, 1)
            pdf.ln(5)
            
            for chart in charts:
                img_bytes = render_chart_to_bytes(chart)
                if img_bytes:
                    with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp:
                        tmp.write(img_bytes.read())
                        tmp_path = tmp.name
                        
                    pdf.image(tmp_path, w=150)
                    pdf.ln(5)
                    os.unlink(tmp_path)
        except Exception as e:
            print("Failed to embed charts in PDF:", e)
        
    # Key Findings
    findings = insights.get("key_findings", [])
    if findings:
        pdf.add_page()
        pdf.set_font("Arial", 'B', 14)
        pdf.cell(0, 10, "Key Findings", 0, 1)
        pdf.set_font("Arial", size=12)
        for i, f in enumerate(findings):
            pdf.multi_cell(0, 8, f"{i+1}. {clean_text(f)}")
        pdf.ln(10)
        
    # ML Results
    ml = raw_data.get("ml_results", {})
    if ml.get("requested"):
        pdf.set_font("Arial", 'B', 14)
        pdf.cell(0, 10, "Machine Learning Results", 0, 1)
        pdf.set_font("Arial", size=12)
        pdf.cell(60, 8, "Best Model:", 0, 0)
        pdf.cell(0, 8, clean_text(ml.get("best_model", "")), 0, 1)
        pdf.cell(60, 8, "CV Score:", 0, 0)
        pdf.cell(0, 8, clean_text(ml.get("cv_score", "")), 0, 1)
        pdf.ln(10)

    # Recommendations
    recs = insights.get("recommendations", [])
    if recs:
        pdf.set_font("Arial", 'B', 14)
        pdf.cell(0, 10, "Actionable Recommendations", 0, 1)
        pdf.set_font("Arial", size=12)
        for i, r in enumerate(recs):
            pdf.multi_cell(0, 8, f"- {clean_text(r)}")
        pdf.ln(10)
        
    # Conclusion
    pdf.set_font("Arial", 'B', 14)
    pdf.cell(0, 10, "Conclusion", 0, 1)
    pdf.set_font("Arial", size=12)
    pdf.multi_cell(0, 8, clean_text(insights.get("conclusion", "")))

    # Custom Slides (from Chat)
    custom_slides = report_data.get("custom_slides", [])
    if custom_slides:
        pdf.add_page()
        pdf.set_font("Arial", 'B', 16)
        pdf.cell(0, 10, "Custom AI Insights", 0, 1, 'C')
        pdf.ln(10)
        
        for c_slide in custom_slides:
            pdf.set_font("Arial", 'B', 14)
            pdf.cell(0, 10, clean_text(c_slide.get("title", "Insight")), 0, 1)
            pdf.set_font("Arial", size=12)
            content = c_slide.get("content", "")
            if isinstance(content, list):
                for pt in content:
                    pdf.multi_cell(0, 8, f"- {clean_text(pt)}")
            else:
                pdf.multi_cell(0, 8, clean_text(content))
            pdf.ln(10)

    # output() in fpdf2 returns bytearray when no filename is specified
    output_val = pdf.output()
    if isinstance(output_val, str):
        pdf_bytes = output_val.encode('latin1')
    else:
        pdf_bytes = bytes(output_val)
        
    return io.BytesIO(pdf_bytes)
