import re
import os

file_path = os.path.join(os.getcwd(), 'src', 'pages', 'FocusedDay.tsx')

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the loading state mismatched tag
content = re.sub(
    r'(<div className="h-72 bg-surface-container-low rounded-2xl animate-pulse" />\s*)</motion\.div>(\s*</AppLayout>)',
    r'\1</div>\2',
    content,
    flags=re.DOTALL
)


with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed syntax error 398")
