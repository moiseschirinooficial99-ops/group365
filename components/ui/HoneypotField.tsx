// Campo trampa anti-spam: invisible para personas (y para lectores de
// pantalla); los bots que rellenan todo lo completan y el servidor descarta
// el envío. Ver lib/leadInput.ts.
export default function HoneypotField() {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
      <label>
        No rellenar
        <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  )
}
