// Backdrop.jsx
function Backdrop({ visible, onClick }) {
  return (
    <div
      className={`backdrop ${visible ? 'visible' : ''}`}
      onClick={onClick}
      aria-hidden="true"
    />
  );
}

export default Backdrop;