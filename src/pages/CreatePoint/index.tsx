import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { Link, useHistory } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import axios from 'axios'

import api from '../../services/api'

import logo from '../../assets/logo.svg'
import './styles.css';

interface CollectionItems {
  id: number,
  title: string,
  image_url: string
}

interface UF {
  id: number,
  sigla: string,
  nome: string
}

interface IBGECityResponse {
  nome: string
}

const CreatePoint: React.FC = () => {
  const [collectionItems, setColletionItems] = useState<CollectionItems[]>([])
  const [uf, setUf] = useState<UF[]>([])
  const [selectedUf, setSelectedUf] = useState('0')
  const [cities, setCities] = useState<string[]>([])
  const [selectedCity, setSelectedCity] = useState('0')
  const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0, 0])
  const [initialPosition, setInitialPosition] = useState<[number, number]>([0, 0])
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
  })

  const history = useHistory()

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(position => {
      const { latitude, longitude } = position.coords;
      setInitialPosition([latitude, longitude]);
    });
  }, []);

  useEffect(() => {
    api.get('/items').then(response => {
      setColletionItems(response.data)
    })
  }, [])

  useEffect(() => {
    axios.get('https://servicodados.ibge.gov.br/api/v1/localidades/estados').then(response => {
      setUf(response.data)
    })
  }, [])

  useEffect(() => {
    if (selectedUf === '0') {
      setCities([])
      return
    }

    axios.get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`)
      .then(response => {
        setCities(response.data.map(city => city.nome))
      })
  }, [selectedUf])


  function handleSelectUf(event: ChangeEvent<HTMLSelectElement>) {
    setSelectedUf(event.target.value)
  }

  function handleSelectedCity(event: ChangeEvent<HTMLSelectElement>) {
    setSelectedCity(event.target.value)
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target

    setFormData({ ...formData, [name]: value })
  }

  function handleSelectItem(id: number) {
    const alreadySelected = selectedItems.findIndex(item => item === id)

    if (alreadySelected >= 0) {
      const filteredItems = selectedItems.filter(item => item !== id)

      setSelectedItems(filteredItems)
    } else {
      setSelectedItems([...selectedItems, id])
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const { name, email, whatsapp } = formData
    const uf = selectedUf
    const city = selectedCity
    const [latitude, longitude] = selectedPosition
    const items = selectedItems

    const data = {
      name,
      email,
      whatsapp,
      uf,
      city,
      latitude,
      longitude,
      items
    }

    await api.post('points', data)

    alert('Ponto de coleta criado')

    history.push('/')
  }

  const MouseMarker = () => {
    useMapEvents({
      click(event) {
        setSelectedPosition([
          event.latlng.lat,
          event.latlng.lng
        ])
      }
    })

    return (
      selectedPosition ?
        <Marker
          key={selectedPosition[0]}
          position={selectedPosition}
          interactive={true}
        />
        : null
    )
  }

  return (
    <div id="page-create-point">
      <header>
        <img src={logo} alt="Ecoleta" />

        <Link to="/">
          <FiArrowLeft />
          Vontar para home
        </Link>
      </header>

      <form onSubmit={handleSubmit}>
        <h1>Cadastro do<br />ponto de coleta</h1>

        <fieldset>
          <legend>
            <h2>Dados</h2>
          </legend>
          <div className="field">
            <label htmlFor="name">Nome da entidade</label>
            <input type="text" name="name" id="name" onChange={handleInputChange} />
          </div>

          <div className="field-group">
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input type="text" name="email" id="email" onChange={handleInputChange} />
            </div>
            <div className="field">
              <label htmlFor="whatsapp">Whatsapp</label>
              <input type="text" name="whatsapp" id="name" onChange={handleInputChange} />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Endereço</h2>
            <span>Selecione o endereço no mapa</span>
          </legend>

          <MapContainer center={[-23.487394, -46.8737503]} zoom={16}>
            <TileLayer
              attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MouseMarker />
          </MapContainer>

          <div className="field-group">
            <div className="field">
              <label htmlFor="uf">Estado (UF)</label>
              <select name="uf" id="uf" onChange={handleSelectUf} value={selectedUf}>
                <option value="0">Selecione uma UF</option>
                {uf.map(item => (
                  <option key={item.id} value={item.sigla}>{item.sigla} - {item.nome}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="cidade">Cidade</label>
              <select name="cidade" id="cidade" onChange={handleSelectedCity} value={selectedCity}>
                <option value="0">Selecione uma cidade</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Ítens de Coleta</h2>
            <span>Selecione um ou mais ítens abaixo</span>
          </legend>
          <ul className="items-grid">
            {collectionItems.map(item => (
              <li
                key={item.id}
                onClick={() => handleSelectItem(item.id)}
                className={selectedItems.includes(item.id) ? 'selected' : ''}
              >
                <img src={item.image_url} alt={item.title} />
                <span>{item.title}</span>
              </li>
            ))}

          </ul>
        </fieldset>

        <button type="submit">
          Cadastrar ponto de coleta
        </button>
      </form>
    </div >
  )
}

export default CreatePoint;