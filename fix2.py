import re
import os

file_path = os.path.join(os.getcwd(), 'src', 'pages', 'FocusedDay.tsx')

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the escaped quotes from my previous Python script
content = content.replace(r"\'minimal\'", "'minimal'")
content = content.replace(r"\'blur(10px)\'", "'blur(10px)'")
content = content.replace(r"\'blur(0px)\'", "'blur(0px)'")

# Fix the loading state mismatched tag
# 396|            <div className="h-20 bg-surface-container-low rounded-xl animate-pulse" />
# 397|            <div className="h-72 bg-surface-container-low rounded-2xl animate-pulse" />
# 398|          </motion.div>
# 399|        </AppLayout>
# 400|      )
# Replace </motion.div> with </div> just before </AppLayout> at the top half of the file
# We can find the exact block for isLoading
loading_block = """          <div className="space-y-6">
            <div className="h-40 bg-surface-container-low rounded-2xl animate-pulse" />
            <div className="h-20 bg-surface-container-low rounded-xl animate-pulse" />
            <div className="h-72 bg-surface-container-low rounded-2xl animate-pulse" />
          </motion.div>"""
fixed_loading_block = """          <div className="space-y-6">
            <div className="h-40 bg-surface-container-low rounded-2xl animate-pulse" />
            <div className="h-20 bg-surface-container-low rounded-xl animate-pulse" />
            <div className="h-72 bg-surface-container-low rounded-2xl animate-pulse" />
          </div>"""
content = content.replace(loading_block, fixed_loading_block)


with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed syntax errors again")
