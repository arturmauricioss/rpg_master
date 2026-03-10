import CharacterBar from "./CharacterBar"
import genesis from "./assets/portraits/genesis.png"

function App() {

  return (

    <div>

      <CharacterBar
        name="Excalibur"
        level={35}
        hp={85}
        maxHp={102}
        mp={40}
        maxMp={100}
        portrait={genesis}
      />

    </div>

  )
}

export default App