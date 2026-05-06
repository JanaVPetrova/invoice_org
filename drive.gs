function getRootFolderName() {
  const yy = String(new Date().getFullYear()).slice(-2);
  return CONFIG.DRIVE_ROOT_FOLDER_PREFIX + "'" + yy;
}

function getInvoicesFolder() {
  const root = getOrCreateDriveFolder(getRootFolderName());
  return getOrCreateDriveFolder(CONFIG.DRIVE_INVOICES_FOLDER, root);
}

function datePrefix(date) {
  return (date || new Date().toISOString().substring(0, 10)).replace(/-/g, '_');
}

function saveAttachmentToDrive(attachment, description, date) {
  const folder = getInvoicesFolder();
  const ext = attachment.getName().includes('.') ? '.' + attachment.getName().split('.').pop() : '';
  const name = datePrefix(date) + '_' + sanitize(description || 'attachment') + ext;
  const file = folder.createFile(attachment.copyBlob().setName(name));
  return file.getUrl();
}

function saveEmailBodyToDrive(htmlBody, description, date) {
  const folder = getInvoicesFolder();
  const name = datePrefix(date) + '_' + sanitize(description || 'email') + '_email.html';
  const file = folder.createFile(Utilities.newBlob(htmlBody, 'text/html', name));
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
