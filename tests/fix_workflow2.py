p = r"C:\Users\vedan\opencode\socitial project\tests\workflow.test.mjs"
s = open(p, encoding="utf-8").read()
old = """  const pickupNotif = getDb().notifications.find((n) => n.donationId === created.id && /Pickup OTP/.test(n.body));
  const pickupCode = pickupNotif.body.match(/Pickup OTP: (\\d{6})/)[1];
  await tasks.confirmPickup(task.id, volunteer, pickupCode);"""
new = "  await tasks.confirmPickup(task.id, volunteer);"
assert old in s, "pickup block not found"
s = s.replace(old, new)

old2 = """  const receiptNotif = getDb().notifications.find((n) => n.donationId === created.id && /Receipt OTP/.test(n.body));
  const receiptCode = receiptNotif.body.match(/Receipt OTP: (\\d{6})/)[1];
  await donations.confirmReceipt(created.id, ngo, receiptCode);"""
new2 = "  await donations.confirmReceipt(created.id, ngo);"
assert old2 in s, "receipt block not found"
s = s.replace(old2, new2)

open(p, "w", encoding="utf-8").write(s)
print("done")