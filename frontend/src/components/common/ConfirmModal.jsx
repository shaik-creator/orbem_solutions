import Button from './Button';
import Modal from './Modal';

export default function ConfirmModal({ open, title, message, confirmLabel = 'Confirm', onConfirm, onClose, loading }) {
  return (
    <Modal open={open} title={title} onClose={onClose} size="max-w-md">
      <p className="text-sm leading-6 text-gray-600">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="danger" loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}
