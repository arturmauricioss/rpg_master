import "./CharacterBar.css"

type Props = {
  name: string
  level: number
  hp: number
  maxHp: number
  mp: number
  maxMp: number
  portrait: string
}

export default function CharacterBar({
  name,
  level,
  hp,
  maxHp,
  mp,
  maxMp,
  portrait
}: Props) {

  const hpPercent = (hp / maxHp) * 100
  const mpPercent = (mp / maxMp) * 100

  return (

    <div className="characterBar">

      <div className="portraitWrapper">
        <img src={portrait} className="portrait"/>
      </div>

      <div className="bars">

        <div className="topInfo">
          <span className="level">Lv {level}</span>
          <span className="name">{name}</span>
        </div>

        <div className="hpBar">
          <div
            className="hpFill"
            style={{ width: hpPercent + "%" }}
          />
        </div>

        <div className="mpBar">
          <div
            className="mpFill"
            style={{ width: mpPercent + "%" }}
          />
        </div>

      </div>

    </div>

  )
}