import React from 'react'
import { useParams } from 'react-router-dom'
import RankPlacementWorkspace from '../../components/ranking/RankPlacementWorkspace'

export default function RankPlacementPage({ role = 'personnel' }) {
  const { personnelId } = useParams()
  return <RankPlacementWorkspace role={role} personnelId={personnelId}/>
}
