export default function Header() {
  return (
    <header
      style={{
        height: "70px",
        width: "100%",
        flexShrink: 0,
        boxSizing: "border-box",
        backgroundColor: "#1f2937",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        borderBottom: "1px solid #374151",
      }}
    >
      <h1>Our Family Headquarters</h1>

      <div>User Menu</div>
    </header>
  );
}
