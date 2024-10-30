import React, {useState} from 'react'
import {useNavigate} from 'react-router-dom'
import useToken from '../../hooks/useToken'

export default function Charge() {
  const [amount, setAmount] = useState('')
  const token = useToken()
  const navigate = useNavigate()

  const handleCharge = () => {
    if (!token) {
      alert('로그인이 필요합니다.')
      return
    }

    const email = sessionStorage.getItem('email')
    if (!email) {
      alert('이메일 정보가 없습니다.')
      return
    }

    const chargeData = {
      email: email,
      addcash: Number(amount) || 0
    }

    fetch(`http://localhost:8080/api/members/charge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(chargeData)
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        return res.json()
      })
      .then(() => {
        alert('캐쉬가 성공적으로 충전되었습니다.')
        navigate('/members/profile')
      })
      .catch(err => {
        console.log('Error:', err)
        alert('캐쉬 충전에 실패했습니다.')
      })
  }

  return (
    <div>
      <h1>캐쉬 충전</h1>
      <div>
        <label>충전 금액: </label>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          style={{
            backgroundColor: 'white',
            border: '1px solid #ccc',
            padding: '10px',
            borderRadius: '4px',
            width: '100%'
          }}
        />
      </div>
      <button onClick={handleCharge}>충전</button>
    </div>
  )
}
