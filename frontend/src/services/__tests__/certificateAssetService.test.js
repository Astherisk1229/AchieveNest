import { beforeEach, describe, expect, it, vi } from 'vitest'
import apiClient from '../apiClient'
import certificateAssetService from '../certificateAssetService'
vi.mock('../apiClient',()=>({default:{get:vi.fn(),post:vi.fn()}}))
describe('certificateAssetService',()=>{
  beforeEach(()=>vi.clearAllMocks())
  it('loads active governed assets',async()=>{apiClient.get.mockResolvedValue({data:{assets:[{id:'a1'}]}});expect(await certificateAssetService.list({asset_type:'FONT'})).toEqual([{id:'a1'}]);expect(apiClient.get).toHaveBeenCalledWith('/certificate-assets',expect.objectContaining({params:{asset_type:'FONT'}}))})
  it('uploads multipart assets with license acknowledgement',async()=>{apiClient.post.mockResolvedValue({data:{id:'a1'}});const file=new File(['font'],'font.ttf');await certificateAssetService.upload({file,assetType:'FONT',displayName:'Formal',licenseAcknowledged:true});const body=apiClient.post.mock.calls[0][1];expect(body).toBeInstanceOf(FormData);expect(body.get('license_acknowledged')).toBe('1')})
  it('loads usage and archives through governed endpoints',async()=>{apiClient.get.mockResolvedValue({data:{usage:[]}});apiClient.post.mockResolvedValue({data:{status:'ARCHIVED'}});await certificateAssetService.usage('a1');await certificateAssetService.archive('a1');expect(apiClient.post).toHaveBeenCalledWith('/certificate-assets/a1/archive')})
})
