from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from PIL import Image
import io
import sqlite3
import json
import os

# PDF
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from db import create_users_table, get_connection, hash_password

# ML Services
from image_service import predict_image
from clinical_service import predict_clinical
from ensemble_service import final_risk

# DB
from db import create_users_table, get_connection

# -----------------------------
# CREATE APP
# -----------------------------
app = FastAPI(
    title="Cervical Cancer Risk Prediction API",
    version="1.0"
)

# -----------------------------
# INIT DATABASE
# -----------------------------
create_users_table()

# -----------------------------
# CORS
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# ROOT
# -----------------------------
@app.get("/")
def root():
    return {"status": "Backend running"}


# =====================================================
# 🔐 AUTH APIs
# =====================================================


@app.post("/register")
def register(data: dict):
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return {"success": False, "error": "Missing fields"}

    hashed = hash_password(password)

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    if cursor.fetchone():
        conn.close()
        return {"success": False, "error": "User already exists"}

    cursor.execute("INSERT INTO users (email, password) VALUES (?, ?)", (email, hashed))
    conn.commit()
    conn.close()
    return {"success": True}


@app.post("/login")
def login(data: dict):
    email = data.get("email")
    password = data.get("password")

    hashed = hash_password(password)

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM users WHERE email = ? AND password = ?",
        (email, hashed)
    )
    user = cursor.fetchone()
    conn.close()

    if not user:
        return {"success": False, "error": "Invalid credentials"}

    return {"success": True}
# =====================================================
# 🔬 PREDICTION APIs
# =====================================================

# =====================================================
# 🔬 PREDICTION APIs (Updated for Dynamic Results)
# =====================================================

@app.post("/predict/image")
async def image_predict(file: UploadFile = File(...)):
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    
    # Original service call
    result = predict_image(image)
    return result




@app.post("/predict/clinical")
async def clinical_predict(data: dict):
    # Pass the whole data dict — clinical_service will engineer features
    raw = data.get("features", data)  # support both formats
    if not raw:
        return {"clinical_score": 0.0, "final_risk": "UNKNOWN"}
    return predict_clinical(raw)

@app.post("/predict/final")
async def final_predict(data: dict):
    try:
        image_score = float(data.get("image_score", 0.0))
        clinical_score = float(data.get("clinical_score", 0.0))
        cell_type = str(data.get("cell_type", ""))
        image_risk = str(data.get("image_risk", ""))
        clinical_risk = str(data.get("clinical_risk", ""))

        result = final_risk(
            image_score, clinical_score,
            cell_type=cell_type,
            image_risk=image_risk,
            clinical_risk=clinical_risk
        )

        return {
            "finalRisk": result.get("risk", "LOW"),
            "finalScore": result.get("final_score", 0.0),
            "clinicalScore": clinical_score,
            "imageConfidence": image_score
        }
    except Exception as e:
        return {"error": str(e), "finalRisk": "UNKNOWN"}
# =====================================================
# 🤖 CHATBOT
# =====================================================

@app.post("/chat")
async def chat(data: dict):
    message = data.get("message", "").lower()
    results = data.get("results", {}) # This is passed from the frontend

    # 🔍 Robust Data Extraction
    # Checks multiple possible keys to ensure we find the result
    risk_value = (
        results.get("finalRisk") or 
        results.get("final_risk") or 
        results.get("risk") or 
        "UNKNOWN"
    ).upper()

    cell_type = results.get("cellType") or results.get("clinical_class") or "detected cells"

    # 🚦 Risk-Specific Responses
    if any(word in message for word in ["risk", "status", "level", "result"]):
        if "HIGH" in risk_value:
            return {"reply": f"🚨 **CRITICAL ALERT:** Your analysis indicates a **HIGH RISK** profile. The system identified {cell_type}. You should download your Clinical PDF and consult a specialist immediately."}
        
        elif "MEDIUM" in risk_value:
            return {"reply": f"⚠️ **MODERATE RISK:** Your risk level is currently **MEDIUM**. {cell_type} were noted in the scan. We recommend a follow-up screening in 3-6 months."}
        
        elif "LOW" in risk_value:
            return {"reply": f"✅ **LOW RISK:** Your results show a **LOW RISK** level. The {cell_type} appear healthy. Continue with your routine annual screenings."}
        
        else:
            return {"reply": "I haven't received your analysis results yet. Please complete the AI Prediction in the dashboard first."}

    # 🛡️ General Medical Knowledge
    elif "precaution" in message:
        return {"reply": "To lower risk: 1. HPV Vaccination, 2. No smoking, 3. Regular Pap smears, 4. Balanced diet."}

    elif "appointment" in message:
        return {"reply": "You can book a consultation in the 'Appointments' tab. High-risk cases are prioritized."}

    else:
        return {"reply": "I'm your AI health assistant. Ask me: 'What is my risk?' or 'What are the next steps?'"}
# =====================================================
# 📄 PDF GENERATION
# =====================================================

@app.post("/generate-pdf")
def generate_pdf(data: dict):
    import datetime
    from reportlab.lib.units import inch
    from reportlab.lib.enums import TA_CENTER, TA_LEFT
    from reportlab.platypus import HRFlowable

    timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    file_path = f"Clinical_Report_{timestamp}.pdf"

    doc = SimpleDocTemplate(
        file_path,
        pagesize=(8.5 * inch, 11 * inch),
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch
    )

    # ── Colors ──
    dark_blue  = colors.HexColor("#0F2D4A")
    mid_blue   = colors.HexColor("#1A4A7A")
    light_blue = colors.HexColor("#EAF3FB")
    border     = colors.HexColor("#D0D7DE")
    text_dark  = colors.HexColor("#1A1A2E")
    text_muted = colors.HexColor("#5A6A7A")

    # ── Data ──
    cell_type        = data.get("cellType", "N/A")
    image_confidence = float(data.get("imageConfidence", 0))
    clinical_score   = float(data.get("clinicalScore", 0))
    final_risk       = data.get("finalRisk", "N/A").upper()
    report_date      = datetime.datetime.now().strftime("%B %d, %Y")
    report_time      = datetime.datetime.now().strftime("%H:%M:%S")
    report_id        = f"RPT-{timestamp}"

    if final_risk == "HIGH":
        risk_color = colors.HexColor("#C0392B")
        insight    = "High risk detected. Immediate medical consultation is strongly recommended. Please consult a gynecologist or oncologist without delay."
    elif final_risk == "MEDIUM":
        risk_color = colors.HexColor("#B7770D")
        insight    = "Moderate risk detected. A follow-up screening is recommended within 3 to 6 months. Please consult your healthcare provider."
    else:
        risk_color = colors.HexColor("#1A7A4A")
        insight    = "Low risk detected. Continue with routine annual cervical screenings and maintain a healthy lifestyle."

    # ── Styles ──
    title_style = ParagraphStyle("TS", fontSize=20, textColor=dark_blue,
                                  fontName="Helvetica-Bold", alignment=TA_CENTER,
                                  spaceAfter=4, leading=26)
    subtitle_style = ParagraphStyle("SS", fontSize=9, textColor=text_muted,
                                     fontName="Helvetica", alignment=TA_CENTER,
                                     spaceAfter=16, leading=13)
    section_style = ParagraphStyle("SH", fontSize=12, textColor=mid_blue,
                                    fontName="Helvetica-Bold", spaceBefore=16,
                                    spaceAfter=6, leading=16)
    normal_style  = ParagraphStyle("NM", fontSize=9, textColor=text_dark,
                                    fontName="Helvetica", leading=14)
    muted_style   = ParagraphStyle("MT", fontSize=8, textColor=text_muted,
                                    fontName="Helvetica", leading=12,
                                    alignment=TA_CENTER)
    footer_style  = ParagraphStyle("FT", fontSize=7.5, textColor=text_muted,
                                    fontName="Helvetica", alignment=TA_CENTER,
                                    leading=11)

    content = []

    # ══════════════════════════
    # 1. TITLE
    # ══════════════════════════
    content.append(Spacer(1, 0.1 * inch))
    content.append(Paragraph("Cervical Cancer Risk Assessment Report", title_style))
    content.append(Paragraph("AI-Assisted Clinical Screening System &nbsp;|&nbsp; Confidential", subtitle_style))
    content.append(HRFlowable(width="100%", thickness=1.5, color=dark_blue, spaceAfter=10))

    # ── Report meta ──
    meta_data = [[
        Paragraph(f"<b>Report ID:</b> {report_id}", normal_style),
        Paragraph(f"<b>Date:</b> {report_date}", normal_style),
        Paragraph(f"<b>Time:</b> {report_time}", normal_style),
        Paragraph("<b>Status:</b> FINAL", normal_style),
    ]]
    meta_table = Table(meta_data, colWidths=[1.75*inch]*4)
    meta_table.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), light_blue),
        ("TOPPADDING",    (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING",   (0, 0), (-1, -1), 10),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 10),
        ("GRID",          (0, 0), (-1, -1), 0.5, border),
    ]))
    content.append(meta_table)

    # ══════════════════════════
    # 2. CELL CATEGORY BOX
    # ══════════════════════════
    content.append(Paragraph("Cell Category", section_style))
    content.append(HRFlowable(width="100%", thickness=0.5, color=border, spaceAfter=8))

    cell_box = Table(
        [[Paragraph(cell_type, ParagraphStyle("CT", fontSize=16, textColor=dark_blue,
                                               fontName="Helvetica-Bold", leading=20))]],
        colWidths=[7 * inch]
    )
    cell_box.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), light_blue),
        ("TOPPADDING",    (0, 0), (-1, -1), 14),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
        ("LEFTPADDING",   (0, 0), (-1, -1), 16),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 16),
        ("LINEBEFORE",    (0, 0), (-1, -1), 4, mid_blue),
        ("GRID",          (0, 0), (-1, -1), 0.5, border),
    ]))
    content.append(cell_box)

    # ══════════════════════════
    # 3. SCORES
    # ══════════════════════════
    content.append(Paragraph("Analysis Scores", section_style))
    content.append(HRFlowable(width="100%", thickness=0.5, color=border, spaceAfter=8))

    scores_data = [
        [Paragraph("IMAGE SCORE", ParagraphStyle("IL", fontSize=8, textColor=text_muted,
                                                  fontName="Helvetica-Bold", alignment=TA_CENTER)),
         Paragraph("CELL SCORE", ParagraphStyle("CL", fontSize=8, textColor=text_muted,
                                                 fontName="Helvetica-Bold", alignment=TA_CENTER))],
        [Paragraph(f"{image_confidence:.6f}", ParagraphStyle("IV", fontSize=18, textColor=dark_blue,
                                                               fontName="Helvetica-Bold",
                                                               alignment=TA_CENTER, leading=24)),
         Paragraph(f"{clinical_score:.6f}", ParagraphStyle("CV", fontSize=18, textColor=risk_color,
                                                             fontName="Helvetica-Bold",
                                                             alignment=TA_CENTER, leading=24))],
    ]
    scores_table = Table(scores_data, colWidths=[3.5*inch, 3.5*inch])
    scores_table.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), colors.white),
        ("GRID",          (0, 0), (-1, -1), 0.5, border),
        ("TOPPADDING",    (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
        ("LEFTPADDING",   (0, 0), (-1, -1), 10),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 10),
    ]))
    content.append(scores_table)

    # ══════════════════════════
    # 4. FINAL ASSESSMENT
    # ══════════════════════════
    content.append(Paragraph("Final Assessment", section_style))
    content.append(HRFlowable(width="100%", thickness=0.5, color=border, spaceAfter=8))

    assessment_box = Table(
        [[Paragraph("FINAL ASSESSMENT", ParagraphStyle("FA", fontSize=9, textColor=text_muted,
                                                        fontName="Helvetica-Bold",
                                                        alignment=TA_CENTER))],
         [Paragraph(final_risk, ParagraphStyle("FR", fontSize=36, textColor=risk_color,
                                                fontName="Helvetica-Bold",
                                                alignment=TA_CENTER, leading=44))],
         [Paragraph(
             "Abnormalities detected. Immediate consultation required." if final_risk == "HIGH"
             else "Monitoring recommended." if final_risk == "MEDIUM"
             else "Normal healthy cells detected.",
             ParagraphStyle("FN", fontSize=9, textColor=text_muted,
                            fontName="Helvetica", alignment=TA_CENTER, leading=13)
         )]],
        colWidths=[7 * inch]
    )
    assessment_box.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), colors.HexColor("#FFF8F8") if final_risk == "HIGH"
                                            else colors.HexColor("#FFFBF0") if final_risk == "MEDIUM"
                                            else colors.HexColor("#F0FFF4")),
        ("LINEBELOW",     (0, 2), (-1, 2), 3, risk_color),
        ("LINEBEFORE",    (0, 0), (-1, -1), 3, risk_color),
        ("LINEAFTER",     (0, 0), (-1, -1), 3, risk_color),
        ("LINEABOVE",     (0, 0), (-1, 0), 3, risk_color),
        ("TOPPADDING",    (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
        ("GRID",          (0, 0), (-1, -1), 0, colors.white),
    ]))
    content.append(assessment_box)

    # ══════════════════════════
    # 5. AI INSIGHT
    # ══════════════════════════
    content.append(Paragraph("AI Insight", section_style))
    content.append(HRFlowable(width="100%", thickness=0.5, color=border, spaceAfter=8))

    insight_box = Table(
        [[Paragraph(insight, normal_style)]],
        colWidths=[7 * inch]
    )
    insight_box.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), colors.HexColor("#F8F9FA")),
        ("LINEBEFORE",    (0, 0), (-1, -1), 4, risk_color),
        ("TOPPADDING",    (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
        ("LEFTPADDING",   (0, 0), (-1, -1), 14),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 14),
        ("GRID",          (0, 0), (-1, -1), 0.5, border),
    ]))
    content.append(insight_box)
    content.append(Spacer(1, 0.3 * inch))

    # ══════════════════════════
    # 6. FOOTER
    # ══════════════════════════
    content.append(HRFlowable(width="100%", thickness=0.5, color=border, spaceAfter=6))
    content.append(Paragraph(
        "This report is generated by an AI-assisted screening system and is intended for informational "
        "purposes only. It does not constitute a medical diagnosis. All findings must be confirmed by a "
        "qualified healthcare professional before any clinical decisions are made.",
        ParagraphStyle("DS", fontSize=7, textColor=text_muted, fontName="Helvetica",
                       alignment=TA_CENTER, leading=11)
    ))
    content.append(Spacer(1, 4))
    content.append(Paragraph(
        f"CervicalAI &nbsp;|&nbsp; {report_date} &nbsp;|&nbsp; {report_id} &nbsp;|&nbsp; CONFIDENTIAL",
        footer_style
    ))

    doc.build(content)
    return FileResponse(
        file_path,
        media_type='application/pdf',
        filename=f"Clinical_Report_{timestamp}.pdf"
    )