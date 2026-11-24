import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '../supabase/supabase-client.service';

export interface Lookup { id: string; name: string; slug?: string; }
export type Row = Record<string, any>;
@Injectable({providedIn:'root'})
export class AdminProductService {
  private db = inject(SupabaseClientService).client;
  async rpc<T>(name: string, args: Row = {}): Promise<T> {
    console.log('[RPC REQUEST]', name, JSON.stringify(args, null, 2));

    const {data,error} = await this.db.rpc(name,args);

    console.log('[RPC RESPONSE]', name, {
      data: data,
      error: error
    });
    if (error) {
      console.error('[AdminProductService] RPC failed:', name, {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });

      throw new Error(
        [error.code, error.message, error.details, error.hint]
          .filter(Boolean)
          .join(' | ')
      );
    }
    return data as T;
  }
  lookups() { return this.rpc<{categories:Lookup[];materials:Lookup[];collections:Lookup[]}>('ss_admin_product_lookups'); }
  list(filters: Row) { return this.rpc<{items:Row[];total:number;counts:Record<string,number>}>('ss_admin_list_products',{p_filters:filters}); }
  get(id:string) { return this.rpc<Row>('ss_admin_get_product',{p_id:id}); }
  create(product:Row) { return this.rpc<Row>('ss_admin_create_product',{p_product:product}); }
  update(id:string, version:string, changes:Row) { return this.rpc<Row>('ss_admin_update_product',{p_id:id,p_expected_version:version,p_changes:changes}); }
  action(action:'publish'|'archive'|'restore',id:string,version:string,reason='') { return this.rpc<Row>(`ss_admin_${action}_product`,{p_id:id,p_expected_version:version,...(action==='archive'?{p_reason:reason}:{})}); }
  material(name:string) { return this.rpc<Lookup>('ss_admin_add_material',{p_name:name}); }
  history(id:string,offset:number) { return this.rpc<{items:Row[];total:number}>('ss_admin_get_product_history',{p_id:id,p_offset:offset,p_limit:25}); }
  async upload(file:File, folder:string, code:string):Promise<Row> {
    if(!/^[a-z0-9_-]+$/.test(folder)||!/^SS_\d+$/.test(code)) throw new Error('Invalid product storage configuration.');
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>25*1024*1024) throw new Error('Choose a JPEG, PNG or WebP image up to 25 MB.');
    const bitmap=await createImageBitmap(file);
    let blob:Blob;
    try {
      const ratio=Math.min(1,2000/Math.max(bitmap.width,bitmap.height));
      const canvas=document.createElement('canvas'); canvas.width=Math.max(1,Math.round(bitmap.width*ratio)); canvas.height=Math.max(1,Math.round(bitmap.height*ratio));
      const ctx=canvas.getContext('2d'); if(!ctx) throw new Error('Image conversion unavailable.');
      ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
      blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?.type==='image/webp'?resolve(b):reject(new Error('WebP conversion failed.')),'image/webp',0.87));
    } finally {bitmap.close();}
    const path=`${folder}/${code}/${crypto.randomUUID()}.webp`;
    const {error}=await this.db.storage.from('product-images').upload(path,blob,{contentType:'image/webp',upsert:false});
    if(error) throw new Error(error.message);
    return {image_url:this.db.storage.from('product-images').getPublicUrl(path).data.publicUrl,alt_text:'',image_type:'gallery',is_primary:false,variant_id:null,sort_order:0};
  }
}
