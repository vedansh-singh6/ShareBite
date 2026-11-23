p = r"C:\Users\vedan\opencode\socitial project\backend\services.py"
s = open(p, encoding="utf-8").read()
# Replace from the first OTP helpers comment through the stray trailing block up to the matching section comment
start = s.index("# ---- OTP helpers (Phase 2 Module 5)")
end = s.index("# ---- Location-based NGO matching")
# keep a newline before
prefix = s[:start].rstrip() + "\n\n"
# restore confirm_delivery ending was already partially there? Check: line 329 ends notify for NGO. Need add donor notify + commit + return.
suffix = '''    notify(donation.donor_id, "Your donation was delivered",
           f"\\"{donation.food_name}\\" reached {ngo_name}.", donation.id)
    db.session.commit()
    return task


'''
s = prefix + suffix + s[end:]
open(p, "w", encoding="utf-8").write(s)
print("done")
PYEOF