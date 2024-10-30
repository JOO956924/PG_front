import React, {useState} from 'react'
import {useNavigate} from 'react-router-dom'
import useToken from '../../hooks/useToken'

const Charge: React.FC = () => {
  const [amount, setAmount] = useState<number>(0)
  const token = useToken()
  const navigate = useNavigate()

  const handleCharge = () => {
    const email = sessionStorage.getItem('email')
    if (!email) {
      alert('로그인이 필요합니다.')
      return
    }

    fetch(`http://localhost:8080/api/members/email/${email}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        return res.json()
      })
      .then(memberData => {
        const updatedCash = memberData.nowcash + amount

        fetch(`http://localhost:8080/api/members/updateCash`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({mid: memberData.mid, nowcash: updatedCash})
        })
          .then(res => {
            if (!res.ok) {
              throw new Error(`HTTP error! status: ${res.status}`)
            }
            return res.json()
          })
          .then(() => {
            alert('포인트가 성공적으로 충전되었습니다.')
            navigate('/members/profile')
          })
          .catch(err => console.log('Error:', err))
      })
      .catch(err => console.log('Error:', err))
  }

  return (
    <div className="charge-container">
      <h1>포인트 충전</h1>
      <div>
        <label htmlFor="amount">포인트 충전 금액: </label>
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={e => setAmount(Number(e.target.value))}
        />
      </div>
      <button onClick={handleCharge}>충전</button>
    </div>
  )
}

export default Charge
