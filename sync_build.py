import os
import shutil

ROOT = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(ROOT, "dist")
DOCS = os.path.join(ROOT, "docs")
WEB = os.path.join(ROOT, "karobaar_app", "web")

def sync():
    for target in [DOCS, WEB]:
        if not os.path.exists(target):
            os.makedirs(target, exist_ok=True)
        # Copy root files from dist
        for item in os.listdir(DIST):
            src_item = os.path.join(DIST, item)
            dst_item = os.path.join(target, item)
            if os.path.isdir(src_item):
                if item == "assets":
                    os.makedirs(dst_item, exist_ok=True)
                    for asset in os.listdir(src_item):
                        shutil.copy2(os.path.join(src_item, asset), os.path.join(dst_item, asset))
                else:
                    if os.path.exists(dst_item):
                        shutil.rmtree(dst_item)
                    shutil.copytree(src_item, dst_item)
            else:
                shutil.copy2(src_item, dst_item)
        
        # Now update all legacy hashed aliases in assets
        assets_dir = os.path.join(target, "assets")
        canonical_index_js = os.path.join(assets_dir, "index.js")
        canonical_index_css = os.path.join(assets_dir, "index.css")
        canonical_biz_js = os.path.join(assets_dir, "BusinessSetup.js")
        canonical_biz_css = os.path.join(assets_dir, "BusinessSetup.css")
        canonical_chartjs = os.path.join(assets_dir, "chartjs.js")
        canonical_firebase = os.path.join(assets_dir, "firebase.js")
        canonical_geo = os.path.join(assets_dir, "geo-data.js")
        canonical_icons = os.path.join(assets_dir, "icons.js")
        canonical_runtime = os.path.join(assets_dir, "rolldown-runtime.js")
        canonical_favicon = os.path.join(assets_dir, "favicon.svg")

        for f in os.listdir(assets_dir):
            full_path = os.path.join(assets_dir, f)
            if f.startswith("index-") and f.endswith(".js") and os.path.exists(canonical_index_js):
                shutil.copy2(canonical_index_js, full_path)
            elif f.startswith("index-") and f.endswith(".css") and os.path.exists(canonical_index_css):
                shutil.copy2(canonical_index_css, full_path)
            elif f.startswith("BusinessSetup-") and f.endswith(".js") and os.path.exists(canonical_biz_js):
                shutil.copy2(canonical_biz_js, full_path)
            elif f.startswith("BusinessSetup-") and f.endswith(".css") and os.path.exists(canonical_biz_css):
                shutil.copy2(canonical_biz_css, full_path)
            elif f.startswith("chartjs-") and f.endswith(".js") and os.path.exists(canonical_chartjs):
                shutil.copy2(canonical_chartjs, full_path)
            elif f.startswith("firebase-") and f.endswith(".js") and os.path.exists(canonical_firebase):
                shutil.copy2(canonical_firebase, full_path)
            elif f.startswith("geo-data-") and f.endswith(".js") and os.path.exists(canonical_geo):
                shutil.copy2(canonical_geo, full_path)
            elif f.startswith("icons-") and f.endswith(".js") and os.path.exists(canonical_icons):
                shutil.copy2(canonical_icons, full_path)
            elif f.startswith("rolldown-runtime-") and f.endswith(".js") and os.path.exists(canonical_runtime):
                shutil.copy2(canonical_runtime, full_path)
            elif f.startswith("favicon-") and f.endswith(".svg") and os.path.exists(canonical_favicon):
                shutil.copy2(canonical_favicon, full_path)

    print("Successfully synchronized dist to docs and karobaar_app/web!")

if __name__ == "__main__":
    sync()
