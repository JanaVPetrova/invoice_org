function saveAttachmentToDrive(attachment, vendor, date) {
  const year = date ? date.substring(0, 4) : String(new Date().getFullYear());
  const month = date ? date.substring(5, 7) : String(new Date().getMonth() + 1).padStart(2, '0');

  const root = getOrCreateDriveFolder(CONFIG.DRIVE_FOLDER_NAME);
  const yearFolder = getOrCreateDriveFolder(year, root);
  const monthFolder = getOrCreateDriveFolder(month, yearFolder);

  const safeName = [date || 'unknown-date', sanitize(vendor || 'unknown'), attachment.getName()]
    .join('_')
    .substring(0, 200);

  const file = monthFolder.createFile(attachment.copyBlob().setName(safeName));
  return file.getUrl();
}

function getOrCreateDriveFolder(name, parent) {
  const iter = parent ? parent.getFoldersByName(name) : DriveApp.getFoldersByName(name);
  if (iter.hasNext()) return iter.next();
  return parent ? parent.createFolder(name) : DriveApp.createFolder(name);
}

function sanitize(name) {
  return name.replace(/[^a-zA-Z0-9\-]/g, '_').substring(0, 50);
}
