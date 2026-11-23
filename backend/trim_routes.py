p = r"C:\Users\vedan\opencode\socitial project\backend\routes_tasks.py"
s = open(p, encoding="utf-8").read()
marker = '@bp.post("/<task_id>/otp/resend")'
idx = s.index(marker)
s = s[:idx].rstrip() + "\n"
open(p, "w", encoding="utf-8").write(s)
print("done")