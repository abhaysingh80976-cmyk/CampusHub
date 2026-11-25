import Modal from './Modal';

export default function ConfirmDialog({
  open, title = 'Are you sure?', message, confirmText = 'Confirm', danger = false, loading = false, onConfirm, onCancel,
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      size="sm"
      footer={
        <>
          <button className="btn btn-outline" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={loading}>
            {loading ? 'Please wait...' : confirmText}
          </button>
        </>
      }
    >
      <p>{message}</p>
    </Modal>
  );
}
