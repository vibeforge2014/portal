#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
VibeForge 投资人汇报 PPT（v4 · Apple Design 风格）
设计语言：Apple keynote / apple.com
- 纯黑主题页（封面/分隔/壁垒/结尾）× 纯白 / #F5F5F7 内容页交替
- Helvetica Neue（西文）+ PingFang SC 苹方（中文）
- 大标题负字距、紧行距；层次靠字重与留白，不靠装饰
- 单一强调色 Apple 蓝 #0071E3；发丝线 #D2D2D7 分隔；状态点绿/蓝/灰
内容与逐字稿沿用 v3 已核实版本。
"""
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml.ns import qn
from pptx.chart.data import CategoryChartData
from pptx.enum.chart import XL_CHART_TYPE, XL_LEGEND_POSITION
import os
from PIL import Image, ImageDraw

# ─────────────────────── 路径 ───────────────────────
BASE = "/Users/qz/Desktop/vibeforge"
ICONS = BASE + "/portal/public/icons"
LOGOS = {
    "chargepilot": BASE + "/aidente/Resources/Assets.xcassets/AppIcon.appiconset/AidenteIcon-1024.png",
    "serverhub":   ICONS + "/serverhub.png",
    "tunesync":    ICONS + "/tunesync.png",
    "minuteflow":  BASE + "/minuteflow/assets/app-icon.png",
    "tailtalk":    ICONS + "/tailtalk.png",
    "tellyra":     ICONS + "/tellyra.png",
    "tivon":       ICONS + "/tivon.png",
}

# ─────────────────────── Apple 设计系统 ───────────────────────
EMU_W, EMU_H = Inches(13.333), Inches(7.5)
BLACK    = RGBColor(0x00, 0x00, 0x00)   # 主题页（keynote 黑）
WHITE    = RGBColor(0xFF, 0xFF, 0xFF)
GRAY_BG  = RGBColor(0xF5, 0xF5, 0xF7)   # apple.com 浅灰
TEXT     = RGBColor(0x1D, 0x1D, 0x1F)   # apple.com 近黑
SUB      = RGBColor(0x6E, 0x6E, 0x73)   # apple.com 次级灰
FAINT    = RGBColor(0x86, 0x86, 0x8B)   # 三级灰
HAIR     = RGBColor(0xD2, 0xD2, 0xD7)   # 发丝线
HAIR_DK  = RGBColor(0x2E, 0x2E, 0x30)   # 深色页发丝线
BLUE     = RGBColor(0x00, 0x71, 0xE3)   # Apple 蓝（唯一强调色）
GREEN    = RGBColor(0x30, 0xA8, 0x50)   # 状态点·已上架（打印安全的绿）
GRAY_DOT = RGBColor(0xAE, 0xAE, 0xB2)   # 状态点·待定
NUM_GRAY = RGBColor(0xC7, 0xC7, 0xCC)   # 大编号灰
# 竞品图表灰阶（我们的产品永远用蓝）
C_GRAY_1 = RGBColor(0xA6, 0xA6, 0xAB)
C_GRAY_2 = RGBColor(0xC7, 0xC7, 0xCC)
C_GRAY_3 = RGBColor(0xE5, 0xE5, 0xEA)

LATIN = "Helvetica Neue"   # SF 的 macOS 基础西文
CN    = "PingFang SC"      # 苹方

prs = Presentation()
prs.slide_width, prs.slide_height = EMU_W, EMU_H
BLANK = prs.slide_layouts[6]


# ─────────────────────── 工具函数 ───────────────────────
def _setfont(run, size, color, bold=False, spc=0, latin=LATIN, cn=CN):
    """spc：字距（磅）。大标题用负值收紧，小标签用正值放松。"""
    run.font.size = Pt(size); run.font.color.rgb = color
    run.font.bold = bold; run.font.name = latin
    rPr = run._r.get_or_add_rPr()
    if spc:
        rPr.set('spc', str(int(spc * 100)))   # DrawingML 单位 = 1/100 pt
    for tag, face in (('a:latin', latin), ('a:ea', cn)):
        el = rPr.find(qn(tag))
        if el is None:
            el = rPr.makeelement(qn(tag), {}); rPr.append(el)
        el.set('typeface', face)


def text(slide, x, y, w, h, s, size=14, color=TEXT, bold=False, spc=0,
         align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, ls=1.3):
    tb = slide.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame; tf.word_wrap = True
    tf.margin_left = tf.margin_right = Emu(0); tf.margin_top = tf.margin_bottom = Emu(0)
    tf.vertical_anchor = anchor
    for i, ln in enumerate(s.split("\n")):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align; p.line_spacing = ls
        r = p.add_run(); r.text = ln
        _setfont(r, size, color, bold, spc)
    return tb


def rect(slide, x, y, w, h, fill, line_c=None, line_w=0.75):
    sh = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, w, h)
    sh.fill.solid(); sh.fill.fore_color.rgb = fill
    if line_c is None: sh.line.fill.background()
    else: sh.line.color.rgb = line_c; sh.line.width = Pt(line_w)
    sh.shadow.inherit = False
    return sh


def round_rect(slide, x, y, w, h, fill, radius=0.05, line_c=None, line_w=0.75):
    sh = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, w, h)
    sh.fill.solid(); sh.fill.fore_color.rgb = fill
    if line_c is None: sh.line.fill.background()
    else: sh.line.color.rgb = line_c; sh.line.width = Pt(line_w)
    sh.shadow.inherit = False
    try: sh.adjustments[0] = radius
    except Exception: pass
    return sh


def oval(slide, x, y, d, fill):
    sh = slide.shapes.add_shape(MSO_SHAPE.OVAL, x, y, d, d)
    sh.fill.solid(); sh.fill.fore_color.rgb = fill
    sh.line.fill.background(); sh.shadow.inherit = False
    return sh


# ── 图标圆角预处理（iOS 圆角、抗锯齿）──
ICON_CACHE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "deck_icons")

def prep_icon(key):
    os.makedirs(ICON_CACHE, exist_ok=True)
    src = LOGOS[key]
    dst = os.path.join(ICON_CACHE, key + ".png")
    if os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src):
        return dst
    im = Image.open(src).convert("RGBA")
    w, h = im.size
    corners = [im.getpixel(p)[3] for p in [(1, 1), (w - 2, 1), (1, h - 2), (w - 2, h - 2)]]
    if all(a == 0 for a in corners):
        im.save(dst); return dst
    S = 4
    r = int(w * 0.224)
    mask = Image.new("L", (w * S, h * S), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, w * S - 1, h * S - 1], radius=r * S, fill=255)
    mask = mask.resize((w, h), Image.LANCZOS)
    im.putalpha(mask); im.save(dst)
    return dst


def logo(slide, key, x, y, size):
    return slide.shapes.add_picture(prep_icon(key), x, y, width=size, height=size)


def set_bg(slide, color):
    f = slide.background.fill; f.solid(); f.fore_color.rgb = color


def note(slide, s):
    slide.notes_slide.notes_text_frame.text = s


def eyebrow(slide, x, y, s, color=SUB, size=11.5, w=Inches(8)):
    """字距放大的眉标（apple.com 区块标签风格）。"""
    text(slide, x, y, w, Inches(0.3), s.upper(), size=size, color=color, bold=True, spc=1.6)


def hairline(slide, y, dark=False, x=Inches(0.85), w=Inches(11.63)):
    rect(slide, x, y, w, Pt(0.75), HAIR_DK if dark else HAIR)


def page_footer(slide, n, dark=False):
    text(slide, Inches(0.85), Inches(7.08), Inches(6), Inches(0.28),
         "VibeForge · 投资人汇报", size=8.5, color=FAINT)
    text(slide, Inches(11.4), Inches(7.08), Inches(1.08), Inches(0.28),
         f"{n:02d}", size=8.5, color=FAINT, align=PP_ALIGN.RIGHT)


def status_dot(slide, x, y, label, color, size=10.5, dark=False):
    """状态：彩色圆点 + 文字（App Store 风格）。"""
    oval(slide, x, y + Inches(0.055), Inches(0.11), color)
    text(slide, x + Inches(0.2), y - Inches(0.02), Inches(3.2), Inches(0.28),
         label, size=size, color=(WHITE if dark else TEXT), bold=False)


def chart_colors(chart, palette):
    for i, pt in enumerate(chart.series):
        pt.format.fill.solid()
        pt.format.fill.fore_color.rgb = palette[i % len(palette)]


def style_chart(chart, title, size=11):
    chart.has_title = True
    chart.chart_title.text_frame.text = title
    _setfont(chart.chart_title.text_frame.paragraphs[0].runs[0], size, FAINT, False)
    chart.has_legend = True
    chart.legend.position = XL_LEGEND_POSITION.BOTTOM
    chart.legend.include_in_layout = False
    chart.legend.font.size = Pt(9.5)
    chart.legend.font.color.rgb = SUB


# ══════════════════ 通用组件 ══════════════════

def divider(num, key, name, tagline, page_no, note_text):
    """主题分隔页：纯黑、居中大 logo、产品名、蓝色标语。"""
    s = prs.slides.add_slide(BLANK); set_bg(s, BLACK)
    text(s, Inches(0.95), Inches(1.35), Inches(3), Inches(0.5), num, size=15, color=FAINT, bold=True, spc=1.5)
    logo(s, key, Inches(5.37), Inches(1.95), Inches(2.6))
    text(s, Inches(0), Inches(4.95), Inches(13.333), Inches(0.75), name, size=44, color=WHITE,
         bold=True, spc=-1.4, align=PP_ALIGN.CENTER)
    text(s, Inches(0), Inches(5.85), Inches(13.333), Inches(0.5), tagline, size=19, color=BLUE,
         align=PP_ALIGN.CENTER)
    page_footer(s, page_no, dark=True)
    note(s, note_text)
    return s


def product_header(slide, key, name, status_label, status_color):
    """产品页头：logo + 名称 + 右侧状态点，下接发丝线。"""
    logo(slide, key, Inches(0.85), Inches(0.62), Inches(0.68))
    text(slide, Inches(1.72), Inches(0.6), Inches(6), Inches(0.4), name, size=21, color=TEXT, bold=True)
    status_dot(slide, Inches(9.4), Inches(0.72), status_label, status_color, size=10.5)
    hairline(slide, Inches(1.5))


def benefit(slide, x, y, num, title, desc, w=Inches(11.6)):
    """编号要点：浅灰大编号 + 加粗标题 + 灰描述。"""
    text(slide, x, y, Inches(0.75), Inches(0.5), num, size=24, color=NUM_GRAY, bold=True)
    text(slide, x + Inches(0.95), y - Inches(0.03), w - Inches(0.95), Inches(0.36),
         title, size=16, color=TEXT, bold=True)
    text(slide, x + Inches(0.95), y + Inches(0.35), w - Inches(0.95), Inches(0.6),
         desc, size=13, color=SUB, ls=1.45)


def info_bar(slide, parts):
    """底部信息条：发丝线 + 居中富文本，蓝色强调关键词。parts: [(text, is_blue), ...]"""
    hairline(slide, Inches(6.32))
    tb = slide.shapes.add_textbox(Inches(0.85), Inches(6.44), Inches(11.63), Inches(0.4))
    tf = tb.text_frame; tf.word_wrap = True
    tf.margin_left = tf.margin_right = Emu(0); tf.margin_top = tf.margin_bottom = Emu(0)
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]; p.alignment = PP_ALIGN.CENTER
    for txt, blue in parts:
        r = p.add_run(); r.text = txt
        _setfont(r, 13, BLUE if blue else TEXT, blue)


def chart_notes(slide, pts):
    """图表页右侧要点列表：小圆点 + 灰文。pts: [(标题, 描述), ...]"""
    text(slide, Inches(8.95), Inches(2.42), Inches(3.55), Inches(0.3), "看懂这张图", size=12, color=TEXT, bold=True)
    y = Inches(2.85)
    for t, d in pts:
        ours = t in ("ChargePilot", "TuneSync", "MinuteFlow", "ServerHub")
        oval(slide, Inches(8.95), y + Inches(0.07), Inches(0.09), BLUE if ours else C_GRAY_1)
        text(slide, Inches(9.18), y, Inches(3.3), Inches(0.95), t + " — " + d, size=11, color=SUB, ls=1.4)
        y += Inches(0.88)


def chart_block(s, categories, series_list, title, gap=110, labels=False):
    """标准竞品图表：蓝=我们，灰=对手。series_list: [(名字, 数值, 颜色), ...]"""
    cd = CategoryChartData()
    cd.categories = categories
    for nm, vals, _c in series_list:
        cd.add_series(nm, vals)
    gf = s.shapes.add_chart(XL_CHART_TYPE.COLUMN_CLUSTERED, Inches(0.7), Inches(2.62), Inches(7.9), Inches(4.05), cd)
    ch = gf.chart; style_chart(ch, title)
    chart_colors(ch, [c for _n, _v, c in series_list])
    ch.plots[0].gap_width = gap
    if labels:
        for pt in ch.series:
            pt.data_labels.show_value = True; pt.data_labels.font.size = Pt(10)
            pt.data_labels.font.color.rgb = SUB
    return ch


# ════════════════════════ 幻灯片 ════════════════════════

# ── P01 封面（纯黑 · keynote 开场）──
s = prs.slides.add_slide(BLANK); set_bg(s, BLACK)
eyebrow(s, Inches(0.95), Inches(1.5), "VibeForge", color=FAINT, size=12)
text(s, Inches(0.95), Inches(2.15), Inches(11.5), Inches(2.1),
     "用一套哲学\n打透 Apple 全平台。", size=54, color=WHITE, bold=True, spc=-1.6, ls=1.08)
text(s, Inches(0.95), Inches(4.6), Inches(11), Inches(0.45),
     "产品介绍与竞品分析 · 投资人汇报", size=16, color=FAINT)
cx = Inches(0.95)
for k in ["chargepilot", "serverhub", "tunesync", "minuteflow"]:
    logo(s, k, cx, Inches(5.5), Inches(0.88)); cx += Inches(2.68)
text(s, Inches(0.95), Inches(6.85), Inches(6), Inches(0.3), "2026.08", size=10.5, color=FAINT, spc=1.2)
note(s, "各位投资人好。VibeForge 是一家隐私优先、深耕 Apple 全平台的独立应用工作室。一句话：我们用同一套哲学——隐私优先、一次买断、原生体验——做出七款产品。今天聚焦四款：ChargePilot 管电池、ServerHub 管服务器、TuneSync 管你的音乐、MinuteFlow 管会议记录。")


# ── P02 关于我们（纯白 · 三瓷贴）──
s = prs.slides.add_slide(BLANK); set_bg(s, WHITE)
eyebrow(s, Inches(0.85), Inches(0.72), "关于我们")
text(s, Inches(0.85), Inches(1.18), Inches(11.6), Inches(1.0),
     "不靠广告、不卖数据、不绑订阅。", size=40, color=TEXT, bold=True, spc=-1.2, ls=1.1)
text(s, Inches(0.85), Inches(2.18), Inches(11), Inches(0.4),
     "做用户真正愿意掏钱买单的工具。", size=15, color=SUB)
pillars = [
    ("01", "隐私优先", "数据留在你自己的设备上，不经过我们的服务器，不卖、不追踪。"),
    ("02", "一次买断", "对抗订阅疲劳。买一次、用一辈子，不按月收钱。"),
    ("03", "低成本扩张", "一个人加自动化流水线，已经铺开七款产品，边际成本极低。"),
]
cw = Inches(3.74); gap = Inches(0.2); x0 = Inches(0.85); cy = Inches(3.15)
for i, (n, t, d) in enumerate(pillars):
    x = x0 + i * (cw + gap)
    round_rect(s, x, cy, cw, Inches(3.35), GRAY_BG, radius=0.045)
    text(s, x + Inches(0.42), cy + Inches(0.42), Inches(1.6), Inches(0.7), n, size=30, color=NUM_GRAY, bold=True)
    text(s, x + Inches(0.42), cy + Inches(1.3), cw - Inches(0.84), Inches(0.45), t, size=19, color=TEXT, bold=True)
    text(s, x + Inches(0.42), cy + Inches(1.92), cw - Inches(0.84), Inches(1.3), d, size=12.5, color=SUB, ls=1.55)
page_footer(s, 2)
note(s, "先说清楚我们是谁。我们不是做一个产品，而是用一套产品哲学打透 Apple 生态。三个支柱：第一，隐私优先，所有应用的数据都留在用户设备上，不经过我们的服务器；第二，一次买断，对抗现在满大街的订阅疲劳；第三，低成本扩张，我一个人借助自动化，已经铺开七款产品，每加一款的边际成本极低。")


# ── P03 产品矩阵（浅灰 · 今日重点 + 后续管线）──
s = prs.slides.add_slide(BLANK); set_bg(s, GRAY_BG)
eyebrow(s, Inches(0.85), Inches(0.72), "产品组合")
text(s, Inches(0.85), Inches(1.12), Inches(11.6), Inches(0.65),
     "七款产品，今日聚焦四款。", size=32, color=TEXT, bold=True, spc=-1.0)
focus = [
    ("chargepilot", "ChargePilot", "电池管理", ("官网在售", BLUE)),
    ("tunesync",    "TuneSync",    "NAS 音乐", ("已上架 App Store", GREEN)),
    ("serverhub",   "ServerHub",   "服务器管理", ("已提交审核", BLUE)),
    ("minuteflow",  "MinuteFlow",  "会议记录", ("即将推出", GRAY_DOT)),
]
cw = Inches(2.83); chh = Inches(2.0); gap = Inches(0.11); x0 = Inches(0.85); y0 = Inches(2.05)
for i, (k, name, cat, (st, stc)) in enumerate(focus):
    x = x0 + i * (cw + gap)
    round_rect(s, x, y0, cw, chh, WHITE, radius=0.05)
    logo(s, k, x + Inches(0.3), y0 + Inches(0.32), Inches(0.66))
    text(s, x + Inches(0.3), y0 + Inches(1.12), cw - Inches(0.6), Inches(0.32), name, size=15.5, color=TEXT, bold=True)
    text(s, x + Inches(0.3), y0 + Inches(1.42), cw - Inches(0.6), Inches(0.26), cat, size=10.5, color=SUB)
    status_dot(s, x + Inches(0.3), y0 + Inches(1.66), st, stc, size=9.5)
pipeline = [
    ("tivon",    "Tivon",    "电视遥控"),
    ("tailtalk", "TailTalk", "宠物情绪"),
    ("tellyra",  "Tellyra",  "IPTV 播放"),
]
pw = Inches(3.74); ph = Inches(1.28); py = Inches(4.62)
for i, (k, name, cat) in enumerate(pipeline):
    x = x0 + i * (pw + Inches(0.2))
    logo(s, k, x, py, Inches(0.5))
    text(s, x + Inches(0.68), py - Inches(0.02), pw - Inches(0.8), Inches(0.3), name, size=13.5, color=TEXT, bold=True)
    text(s, x + Inches(0.68), py + Inches(0.26), pw - Inches(0.8), Inches(0.26), cat, size=10.5, color=SUB)
    status_dot(s, x + Inches(0.68), py + Inches(0.56), "已提交审核", BLUE, size=9.5)
eyebrow(s, x0, Inches(6.15), "后续管线 · 均已提交审核", color=FAINT, size=10)
text(s, Inches(0.85), Inches(6.55), Inches(11.6), Inches(0.35),
     "1 款官网在售 · 1 款已上架 · 4 款已提交审核，按节奏逐个放量。", size=13, color=SUB)
page_footer(s, 3)
note(s, "这是我们的完整产品矩阵，七款产品覆盖六个方向。今天重点讲上面四款：ChargePilot 官网在售、是我们的旗舰；TuneSync 已经上架 App Store；ServerHub 已提交审核；MinuteFlow 是储备管线。下面三款也已提交审核——四款正在过审，随时可能上架，构成后续发布管线。")


# ── P04 两个趋势（纯白 · 大字排印）──
s = prs.slides.add_slide(BLANK); set_bg(s, WHITE)
eyebrow(s, Inches(0.85), Inches(0.72), "为什么是现在")
text(s, Inches(0.85), Inches(1.12), Inches(11.6), Inches(0.65),
     "卡位两个不可逆的趋势。", size=32, color=TEXT, bold=True, spc=-1.0)
trends = [
    ("趋势一", "订阅疲劳", "用户厌倦了为每个工具按月付费——一个管服务器的软件一年约 ¥860。", "我们的回答：一次买断，买一次用一辈子。"),
    ("趋势二", "隐私觉醒", "用户越来越不愿意把数据全部交给云端，尤其会议、密钥这类敏感内容。", "我们的回答：本地优先，数据不经过我们的服务器。"),
]
y = Inches(2.25)
for i, (tag, t, d, ans) in enumerate(trends):
    text(s, Inches(0.85), y, Inches(2), Inches(0.3), tag, size=11.5, color=FAINT, bold=True, spc=1.2)
    text(s, Inches(0.85), y + Inches(0.36), Inches(4.4), Inches(0.75), t, size=38, color=TEXT, bold=True, spc=-1.2)
    text(s, Inches(5.6), y + Inches(0.18), Inches(6.9), Inches(1.1), d, size=14.5, color=SUB, ls=1.5)
    text(s, Inches(5.6), y + Inches(1.18), Inches(6.9), Inches(0.4), ans, size=14.5, color=BLUE, bold=True)
    if i == 0:
        hairline(s, y + Inches(1.85))
    y += Inches(2.2)
text(s, Inches(0.85), Inches(6.5), Inches(12), Inches(0.4),
     "每一款产品，都正好卡在对手最痛的地方。", size=15, color=TEXT, bold=True)
page_footer(s, 4)
note(s, "为什么是现在？因为我们正好踩在两个不可逆的趋势上。第一个是订阅疲劳，用户真的厌倦了——一个管服务器的软件一年约收八百多块。我们的回答很简单：一次买断。第二个是隐私觉醒，大家越来越不愿意把敏感数据全交给云端。我们的回答：本地优先，数据不经过我们的服务器。每一款产品，都正好卡在对手最痛的地方。")



# ── P05 市场格局宽表（浅灰 · 竞品价格/体量/前景）──
s = prs.slides.add_slide(BLANK); set_bg(s, GRAY_BG)
eyebrow(s, Inches(0.85), Inches(0.72), "市场格局")
text(s, Inches(0.85), Inches(1.12), Inches(11.6), Inches(0.65),
     "对手已经验证了市场。", size=32, color=TEXT, bold=True, spc=-1.0)
text(s, Inches(0.85), Inches(1.82), Inches(11.6), Inches(0.35),
     "每条赛道都有付费成功的对手——我们把它们的订阅，换成一次买断。", size=13.5, color=SUB)
# 表头
COLS = [
    (0.85, 1.15, "赛道"), (2.05, 1.35, "竞品"), (3.45, 1.95, "它们的定价"),
    (5.45, 2.35, "体量（公开数据）"), (7.85, 2.15, "赛道前景"), (10.05, 2.43, "我们的卡位"),
]
hy = Inches(2.42)
for cx, cw_, label in COLS:
    text(s, Inches(cx), hy, Inches(cw_), Inches(0.26), label, size=10, color=FAINT, bold=True, spc=0.8)
hairline(s, 2.72)
ROWS = [
    ("电池管理", "AlDente", "买断 $9–25", "未公开 · Setapp 精选", "Mac 保有量大 · 刚需", "ChargePilot 官网在售"),
    ("服务器管理", "Termius", "订阅 约$120/年", "200万+ 工程师", "开发者工具稳定增长", "ServerHub 买断·即将上架"),
    ("自托管音乐", "Plexamp", "需 Plex 订阅", "未公开", "NAS 自托管用户增长", "TuneSync 已上架·免费+订阅"),
    ("会议纪要", "Otter.ai", "订阅制", "ARR $1亿+ · 用户 3500万+", "AI 纪要高增长赛道", "MinuteFlow ¥99 买断"),
    ("IPTV", "TiviMate", "免费+高级订阅", "500万+ 安装", "大屏需求稳 · 仅 Android", "Tellyra 审核中·补 Apple 空位"),
    ("宠物 AI", "MeowTalk", "订阅 约$60/年", "2000万+ 下载", "宠物经济持续增长", "TailTalk 审核中·隐私优先"),
]
ry = 2.88
RH = 0.62
for i, (track, comp, pricing, scale, outlook, ours) in enumerate(ROWS):
    y = Inches(ry)
    text(s, Inches(0.85), y, Inches(1.15), Inches(0.3), track, size=12, color=TEXT, bold=True)
    text(s, Inches(2.05), y, Inches(1.35), Inches(0.3), comp, size=12.5, color=TEXT)
    text(s, Inches(3.45), y, Inches(1.95), Inches(0.3), pricing, size=11.5, color=SUB)
    text(s, Inches(5.45), y, Inches(2.35), Inches(0.3), scale, size=11.5, color=TEXT, bold="万" in scale or "亿" in scale)
    text(s, Inches(7.85), y, Inches(2.15), Inches(0.3), outlook, size=10.5, color=SUB)
    text(s, Inches(10.05), y, Inches(2.43), Inches(0.3), ours, size=10.5, color=BLUE, bold=True)
    ry += RH
    if i < len(ROWS) - 1:
        hairline(s, ry - 0.10)
hairline(s, ry - 0.08)
text(s, Inches(0.85), Inches(ry + 0.06), Inches(11.63), Inches(0.5),
     "来源：各产品官网 / Google Play / ZoomInfo / Otter.ai 官方公告等公开资料（2026.08）；未公开 = 无可靠公开数据。",
     size=8.5, color=FAINT, ls=1.4)
page_footer(s, 5)
note(s, "这张表是市场验证。每条赛道都已经有对手把收费跑通了：会议纪要的 Otter 年收入超过一亿美元、三千五百万用户；管服务器的 Termius 有两百万工程师在用；安卓端的 IPTV 播放器 TiviMate 五百万安装；宠物翻译 MeowTalk 两千万下载。这些数字证明用户愿意为这类工具掏钱。而它们几乎全用订阅制——我们用一次买断进场，直接接住对订阅不满的用户。电池管理和自托管音乐两条赛道对手数据未公开，但 Setapp 精选和 Plex 订阅体系同样证明了付费意愿。")


# ══════════════════ ChargePilot ══════════════════

divider("01", "chargepilot", "ChargePilot", "让你的电池多用三年。", 6,
        "第一款，ChargePilot。一句话：让你的电池多用三年。它是我们目前唯一在售的产品，也是旗舰。")

# ── P06 价值 + 商业模式（纯白）──
s = prs.slides.add_slide(BLANK); set_bg(s, WHITE)
product_header(s, "chargepilot", "ChargePilot", "官网在售", BLUE)
text(s, Inches(0.85), Inches(1.95), Inches(10), Inches(0.9),
     "让你的电池，多用三年。", size=44, color=TEXT, bold=True, spc=-1.4)
text(s, Inches(0.85), Inches(3.05), Inches(9), Inches(0.4),
     "为 · 长期插着电源用 Mac 的人", size=15, color=SUB)
ben = [
    ("01", "省钱", "换一块电池上千元。ChargePilot 让电池多用几年，把这笔钱省下来。"),
    ("02", "省心", "自动管理充电上限和温度，你不用再记着拔电源。"),
    ("03", "灵活付费", "免费先用，满意了再选订阅或一次性买断，14 天可退款。"),
]
y = Inches(3.75)
for n, t, d in ben:
    benefit(s, Inches(0.85), y, n, t, d); y += Inches(0.85)
info_bar(s, [("商业模式：", False), ("永久免费", True), ("（监控） · ", False),
             ("年订阅", True), ("（7 天试用） · ", False), ("终身买断", True), ("（一次付费）", False)])
page_footer(s, 7)
note(s, "ChargePilot 解决一个很真实的痛点：很多人 Mac 一直插着电，电池长期满充，老化很快，换一块电池要上千块。我们的价值就是让电池多用几年，把这笔钱省下来。三个点：省钱、省心、灵活付费——免费先用，满意再买断或订阅，14 天可退款。商业模式是免费加订阅加买断三档，官网上已经开卖，是我们跑通商业闭环的旗舰。")

# ── P07 竞品图表（浅灰）──
s = prs.slides.add_slide(BLANK); set_bg(s, GRAY_BG)
product_header(s, "chargepilot", "ChargePilot", "竞品对比", GRAY_DOT)
text(s, Inches(0.85), Inches(1.85), Inches(11.6), Inches(0.6),
     "别人只给你看数据，我们帮你管充电。", size=28, color=TEXT, bold=True, spc=-0.8)
chart_block(s, ['限制充电\n上限', '过热\n自动停充', '按场景\n自动排程', '主动\n放电', '电池\n校准'], [
    ('ChargePilot', (100,100,100,100,100), BLUE),
    ('AlDente', (100,70,85,100,60), C_GRAY_1),
    ('系统自带', (40,0,0,0,0), C_GRAY_2),
    ('监控类工具', (0,0,0,0,0), C_GRAY_3),
], "能力覆盖（%，定性评估）")
chart_notes(s, [
    ("AlDente", "老牌对手，但在过热保护和校准上仍有缺口"),
    ("系统自带", "免费，但只能做最基础的优化"),
    ("监控类", "只显示数据，不会帮你做任何事"),
    ("ChargePilot", "不只是看，是主动帮你把电充对"),
])
page_footer(s, 8)
note(s, "竞品这块，蓝色是我们。最大的对手是 AlDente，老牌，但在过热保护和电池校准上有缺口。系统自带的最基础，只能优化、不能自定义。还有一类纯监控工具，只给你看数据，什么都不帮你做。我们的定位就一句话：别人只给你看数据，我们帮你管充电。")


# ══════════════════ ServerHub ══════════════════

divider("02", "serverhub", "ServerHub", "手机就能管服务器，买一次用一辈子。", 9,
        "第二款，ServerHub，已提交 App Store 审核、即将上架。一句话：手机就能管服务器，买一次用一辈子。")

# ── P09 价值（纯白）──
s = prs.slides.add_slide(BLANK); set_bg(s, WHITE)
product_header(s, "serverhub", "ServerHub", "已提交审核", BLUE)
text(s, Inches(0.85), Inches(1.95), Inches(11), Inches(1.5),
     "手机就能管服务器，\n买一次用一辈子。", size=42, color=TEXT, bold=True, spc=-1.3, ls=1.12)
text(s, Inches(0.85), Inches(3.55), Inches(9), Inches(0.4),
     "为 · 有自己服务器的开发者、小团队、极客", size=15, color=SUB)
ben = [
    ("01", "省钱", "主流订阅工具一年约 ¥860、越用越贵；我们一次买断，费用不随年份增长。"),
    ("02", "随身", "手机随时看服务器状态、传文件、管容器，不用回到电脑前。"),
    ("03", "安全", "你的密码只存在你手机里，连接不经过任何第三方。"),
]
y = Inches(4.15)
for n, t, d in ben:
    benefit(s, Inches(0.85), y, n, t, d); y += Inches(0.8)
page_footer(s, 10)
note(s, "ServerHub 是给有自己服务器的人——开发者、小团队、极客。它已提交审核、即将上架。价值是手机就能管服务器，而且一次买断。三个点：第一省钱，主流订阅工具比如 Termius 一年约八百多，我们一次买断，费用不随年份增长；第二随身，手机就能看状态、传文件、管容器；第三安全，你的密码只存在你手机里，连接不经过任何第三方。")

# ── P10 竞品图表（浅灰 · 大数字统计）──
s = prs.slides.add_slide(BLANK); set_bg(s, GRAY_BG)
product_header(s, "serverhub", "ServerHub", "竞品对比", GRAY_DOT)
text(s, Inches(0.85), Inches(1.85), Inches(11.6), Inches(0.6),
     "订阅的钱，一年一年往上叠。", size=28, color=TEXT, bold=True, spc=-0.8)
chart_block(s, ['第 1 年', '第 2 年', '第 3 年'], [
    ('Termius Pro 订阅', (860, 1720, 2580), C_GRAY_1),
], "Termius 订阅累计花费（按年费约 ¥860 估算）", gap=140, labels=True)
# 右侧：apple.com 大数字统计风格
text(s, Inches(8.95), Inches(2.6), Inches(3.55), Inches(0.3), "TERMIUS 三年订阅费", size=10.5, color=FAINT, bold=True, spc=1.2)
text(s, Inches(8.95), Inches(2.92), Inches(3.55), Inches(0.9), "¥2,580", size=44, color=TEXT, bold=True, spc=-1.2)
text(s, Inches(8.95), Inches(3.92), Inches(3.55), Inches(0.35),
     "我们的回答：买断只付一次。", size=14, color=BLUE, bold=True)
hairline(s, Inches(4.5), x=Inches(8.95), w=Inches(3.55))
text(s, Inches(8.95), Inches(4.75), Inches(3.55), Inches(1.6),
     "社区里最常见的抱怨就是「不想为一个管服务器的工具长期付费」。我们用买断制直接接住这批用户。",
     size=11.5, color=SUB, ls=1.55)
page_footer(s, 11)
note(s, "这张图最能说明问题。Termius 订阅第一年约 860，第二年 1720，第三年 2580——订阅的钱一年一年往上叠。而 ServerHub 的回答是一次买断：买一次，费用不随年份增长，定价以上架公布为准。社区里最常见的抱怨就是——不想为一个管服务器的工具长期付费，我们就用买断制直接接住这批用户。")


# ══════════════════ TuneSync ══════════════════

divider("03", "tunesync", "TuneSync", "你自己的音乐，随时听。", 12,
        "第三款，TuneSync，已经上架 App Store，8 月 11 日刚更新到 1.0.11，链接 apps.apple.com/cn/app/id6783845149。一句话：你自己的音乐，随时听。")

# ── P12 价值（纯白）──
s = prs.slides.add_slide(BLANK); set_bg(s, WHITE)
product_header(s, "tunesync", "TuneSync", "已上架 App Store", GREEN)
text(s, Inches(0.85), Inches(1.95), Inches(10), Inches(0.9),
     "你自己的音乐，随时听。", size=44, color=TEXT, bold=True, spc=-1.4)
text(s, Inches(0.85), Inches(3.05), Inches(9), Inches(0.4),
     "为 · 有自己音乐收藏、不想被月租绑架的人", size=15, color=SUB)
ben = [
    ("01", "自由", "不用每个月给音乐软件交订阅费，你收藏的就是你的。"),
    ("02", "简单", "连上你的 NAS 或网盘就能用，不用自己搭复杂的服务器。"),
    ("03", "有趣", "独家 K 歌模式，把你的私人曲库变成卡拉 OK。"),
]
y = Inches(3.75)
for n, t, d in ben:
    benefit(s, Inches(0.85), y, n, t, d); y += Inches(0.85)
info_bar(s, [("已上架 App Store：", False), ("免费下载", True), (" · ", False),
             ("TuneSync Plus 订阅", True), ("解锁高级功能", False)])
page_footer(s, 13)
note(s, "TuneSync 已经上架 App Store，免费下载，Plus 订阅解锁高级功能。它给有自己音乐收藏、不想被月租绑架的人。价值是：你自己的音乐，随时听。三个点：第一自由，不用每个月给音乐软件交订阅；第二简单，连上你的 NAS 或网盘就能用，不用自己搭复杂的服务器；第三有趣，我们有独家的 K 歌模式，把你的私人曲库变成卡拉 OK。")

# ── P13 竞品图表（浅灰）──
s = prs.slides.add_slide(BLANK); set_bg(s, GRAY_BG)
product_header(s, "tunesync", "TuneSync", "竞品对比", GRAY_DOT)
text(s, Inches(0.85), Inches(1.85), Inches(11.6), Inches(0.6),
     "免搭服务器 + K 歌，差异化切入。", size=28, color=TEXT, bold=True, spc=-0.8)
chart_block(s, ['连上 NAS\n就能用', '免费\n下载', 'K 歌\n模式', '隐私\n不上云'], [
    ('TuneSync', (100,100,100,100), BLUE),
    ('Amperfy', (30,100,0,100), C_GRAY_1),
    ('Plexamp', (0,60,0,60), C_GRAY_2),
    ('Sonora', (30,100,0,80), C_GRAY_3),
], "能力覆盖（%，定性评估）")
chart_notes(s, [
    ("Amperfy", "社区首选，但要自己搭服务器，门槛高"),
    ("Plexamp", "体验好，但锁死在 Plex 生态、要订阅"),
    ("Sonora", "新兴客户端，还在打磨，没有 K 歌"),
    ("TuneSync", "连上存储就能用，还有独家 K 歌"),
])
page_footer(s, 14)
note(s, "自托管音乐这个赛道，蓝色是我们。Amperfy 是社区首选，但得自己搭服务器，门槛高。Plexamp 体验好，但锁死在 Plex 生态、还要订阅。Sonora 这些新兴的还在打磨，都没有 K 歌。TuneSync 的差异就在两点：连上你已有的存储就能用，不用搭服务器；还有独家的 K 歌模式。")


# ══════════════════ MinuteFlow ══════════════════

divider("04", "minuteflow", "MinuteFlow", "录音自动变会议记录。", 15,
        "第四款，MinuteFlow，储备产品。一句话：录音自动变会议记录，全程不上云。")

# ── P15 价值（纯白）──
s = prs.slides.add_slide(BLANK); set_bg(s, WHITE)
product_header(s, "minuteflow", "MinuteFlow", "即将推出", GRAY_DOT)
text(s, Inches(0.85), Inches(1.95), Inches(11), Inches(1.5),
     "录音自动变会议记录，\n全程不上云。", size=42, color=TEXT, bold=True, spc=-1.3, ls=1.12)
text(s, Inches(0.85), Inches(3.55), Inches(9), Inches(0.4),
     "为 · 开会多的人和小团队", size=15, color=SUB)
ben = [
    ("01", "省时", "开完会，会议纪要和摘要自动生成，不用再手写整理。"),
    ("02", "安全", "数据留在你自己的电脑和手机上，全程不上云。"),
    ("03", "中文友好", "中文和中英混合会议，是我们首发的语言优先。"),
]
y = Inches(4.15)
for n, t, d in ben:
    benefit(s, Inches(0.85), y, n, t, d); y += Inches(0.8)
info_bar(s, [("桌面端定价：", False), ("¥99 一次买断，终身使用", True),
             (" · 录音、转写、AI 纪要全部解锁", False)])
page_footer(s, 16)
note(s, "MinuteFlow 是给开会多的人和小团队。价值是：录音自动变会议记录，全程不上云。三个点：第一省时，开完会纪要和摘要自动生成；第二安全，数据留在你自己设备上，全程不上云；第三中文友好，中文和中英混合会议是我们首发的语言优先。桌面端 99 块一次买断，录音、转写、AI 纪要全部解锁。这是储备管线里的产品；iOS 版已在 App Store Connect 创建记录、筹备提交，桌面端即将推出。")

# ── P16 竞品图表（浅灰）──
s = prs.slides.add_slide(BLANK); set_bg(s, GRAY_BG)
product_header(s, "minuteflow", "MinuteFlow", "竞品对比", GRAY_DOT)
text(s, Inches(0.85), Inches(1.85), Inches(11.6), Inches(0.6),
     "本地优先 + 中文，对抗强云端。", size=28, color=TEXT, bold=True, spc=-0.8)
chart_block(s, ['数据\n不上云', '中文\n中英混合', '一次\n买断', '不绑\n生态'], [
    ('MinuteFlow', (100,100,100,100), BLUE),
    ('飞书妙记', (10,100,0,0), C_GRAY_1),
    ('Otter', (20,40,0,60), C_GRAY_2),
    ('Notta', (10,70,0,60), C_GRAY_3),
], "能力覆盖（%，定性评估）")
chart_notes(s, [
    ("飞书妙记", "功能强，但全程上云、绑死生态，隐私顾虑大"),
    ("Otter", "主流选择，但英文为主、全程云端"),
    ("Notta", "订阅制、免费额度有限、中文还行"),
    ("MinuteFlow", "本地不上云 + 中文优先 + 买断"),
])
page_footer(s, 17)
note(s, "会议记录赛道对手很强，但都有明显短板，蓝色是我们。飞书妙记功能强，但全程上云、绑死生态，隐私顾虑大。Otter 是主流，但英文为主、全程云端。Notta 订阅制、免费额度有限。MinuteFlow 正好卡在空位：数据不上云、中文优先、一次买断。")


# ══════════════════ 收尾 ══════════════════

# ── P17 五重壁垒（纯黑 · 排印式两列）──
s = prs.slides.add_slide(BLANK); set_bg(s, BLACK)
eyebrow(s, Inches(0.85), Inches(0.72), "竞争壁垒", color=FAINT)
text(s, Inches(0.85), Inches(1.12), Inches(11.6), Inches(0.65),
     "五重壁垒，组合即护城河。", size=32, color=WHITE, bold=True, spc=-1.0)
moats = [
    ("01", "统一哲学", "隐私 + 买断 + 原生，七款产品同一个承诺，跨品类建立信任。"),
    ("02", "低成本扩张", "一人加自动化，每加一款产品成本极低，对手难以速成。"),
    ("03", "趋势卡位", "正好踩在订阅疲劳和隐私觉醒两个不可逆趋势上。"),
    ("04", "旗舰验证", "ChargePilot 已跑通付费闭环，证明用户愿意为这套哲学买单。"),
    ("05", "多线管线", "应用矩阵已蓄水，可按节奏逐个放量，持续的增长曲线。"),
]
positions = [(Inches(0.85), Inches(2.35)), (Inches(0.85), Inches(3.9)), (Inches(0.85), Inches(5.45)),
             (Inches(7.0), Inches(2.35)), (Inches(7.0), Inches(3.9))]
for (n, t, d), (x, y) in zip(moats, positions):
    text(s, x, y, Inches(0.85), Inches(0.5), n, size=22, color=FAINT, bold=True)
    text(s, x + Inches(1.0), y - Inches(0.02), Inches(4.6), Inches(0.36), t, size=17, color=WHITE, bold=True)
    text(s, x + Inches(1.0), y + Inches(0.36), Inches(4.6), Inches(1.0), d, size=11.5, color=FAINT, ls=1.5)
rect(s, Inches(6.6), Inches(2.35), Pt(0.75), Inches(3.9), HAIR_DK)   # 竖分隔线
page_footer(s, 18, dark=True)
note(s, "最后总结为什么值得投资，五重壁垒。第一，统一的产品哲学，七款产品同一个承诺，跨品类建立信任。第二，低成本扩张，一个人加自动化，对手难以速成。第三，正好踩在订阅疲劳和隐私觉醒两个不可逆趋势上。第四，ChargePilot 已经跑通付费闭环，证明用户愿意为这套哲学买单。第五，应用矩阵已经蓄水，可以按节奏放量。单个产品容易被复制，但七款产品组合在一起，才是真正的护城河。")

# ── P18 结尾（纯黑）──
s = prs.slides.add_slide(BLANK); set_bg(s, BLACK)
text(s, Inches(0), Inches(2.45), Inches(13.333), Inches(1.3), "谢谢。", size=64, color=WHITE,
     bold=True, spc=-2.0, align=PP_ALIGN.CENTER)
text(s, Inches(0), Inches(3.95), Inches(13.333), Inches(0.5),
     "用一套哲学，打透 Apple 全平台。", size=19, color=BLUE, align=PP_ALIGN.CENTER)
cx = Inches(3.35)
for k in ["chargepilot", "serverhub", "tunesync", "minuteflow"]:
    logo(s, k, cx, Inches(5.15), Inches(0.82)); cx += Inches(1.62)
text(s, Inches(0), Inches(6.5), Inches(13.333), Inches(0.4),
     "VibeForge · 2026.08", size=11, color=FAINT, align=PP_ALIGN.CENTER, spc=1.2)
note(s, "以上就是我的汇报。一句话收尾：VibeForge 不是在做一款产品，而是用一套哲学打透整个 Apple 平台。谢谢各位，欢迎提问。")


# ─────────────────────── 保存 ───────────────────────
out = BASE + "/portal/VibeForge-投资人汇报.pptx"
prs.save(out)
print("已生成:", out)
print("总页数:", len(prs.slides._sldIdLst))
