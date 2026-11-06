from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
source = root / "course-starters" / "quality-engineering-lab"
target = root / "public" / "downloads" / "quality-engineering-lab.zip"
target.parent.mkdir(parents=True, exist_ok=True)
with ZipFile(target, "w", compression=ZIP_DEFLATED) as archive:
    for path in sorted(source.rglob("*")):
        if not path.is_file() or (path.suffix not in {".py", ".md", ".yml"} and path.name != ".gitignore"):
            continue
        name = "quality-engineering-lab/" + path.relative_to(source).as_posix()
        item = ZipInfo(name, date_time=(2026, 11, 6, 0, 0, 0))
        item.compress_type = ZIP_DEFLATED
        archive.writestr(item, path.read_bytes())
print(target)
