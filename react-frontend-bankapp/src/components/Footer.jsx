function Footer({ isAdmin }) {
  return (
    <footer className="app-footer">
      <p>Simple Bank Application</p>
      <p>{isAdmin ? 'Administrative workspace' : 'Self-service banking'}</p>
    </footer>
  )
}

export default Footer
