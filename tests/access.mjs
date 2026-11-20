import assert from 'node:assert/strict'
import { accountSeeds, R, UNIT, migrateCase, migrateReport, permit, canReadCase, canReadReport, visibleLogs } from '../src/access.ts'
import { applyOperation } from '../src/operations.ts'
const ids={citizen:'cong.dan.demo',reception:'tiep.nhan.demo',analyst:'phan.tich.demo',worker:'xu.ly.demo',other:'xu.ly.huy',leader:'lanh.dao.demo',supervisor:'giam.sat.demo',admin:'quan.tri.demo'}
const base=(id,cluster,amount)=>migrateReport({id,title:'Sự việc '+id,content:'Lời khai gốc',senderName:'Người gửi mẫu',source:'Cổng trực tuyến',area:'Hà Nội',status:cluster?'Đã phân tích':'Mới tiếp nhận',behavior:'Giả danh ngân hàng',amount,cluster,account:'DEMO-TK-001',phone:'DEMO-SDT-001',website:'demo.example',submittedBy:ids.citizen})
let state={reports:[base('PA-001','CUM-001',10),base('PA-002','CUM-001',20),base('PA-003','CUM-001',15),base('PA-013',undefined,15)],cases:[],accounts:structuredClone(accountSeeds)}
const time='2026-10-27T02:00:00.000Z',audit=[]
const op=(actor,command)=>{const next=applyOperation(state,ids[actor]||actor,command,time);audit.push(next.log);state={reports:next.reports,cases:next.cases,accounts:next.accounts};return next}
const denied=(actor,command)=>{const before=JSON.stringify(state);assert.throws(()=>applyOperation(state,ids[actor]||actor,command,time));assert.equal(JSON.stringify(state),before)}
const get=()=>state.reports.find(r=>r.id==='PA-013')
for(const who of ['citizen','worker','leader','supervisor','admin'])denied(who,{type:'receive',id:'PA-013',step:'transfer',note:'Đã kiểm tra',assignee:ids.analyst})
denied('analyst',{type:'extract-save',id:'PA-013',patch:get()})
op('reception',{type:'receive',id:'PA-013',step:'request',note:'Bổ sung biên nhận'})
const content=get().content
op('citizen',{type:'supplement',id:'PA-013',content:'Bổ sung riêng',attachment:true});assert.equal(get().content,content);assert.equal(get().supplements.length,1)
denied('citizen',{type:'supplement',id:'PA-013',content:'Gửi sai bước',attachment:false})
op('reception',{type:'receive',id:'PA-013',step:'transfer',note:'Phiếu đầy đủ',assignee:ids.analyst})
denied('reception',{type:'link',id:'PA-013',clusterId:'CUM-001'});denied('analyst',{type:'link',id:'PA-013',clusterId:'CUM-001'})
op('analyst',{type:'extract-start',id:'PA-013'})
op('analyst',{type:'extract-save',id:'PA-013',patch:{...get(),content:'Cố sửa lời khai',unitId:'Khác',submittedBy:'khác',amount:15,reviewed:true}})
assert.equal(get().content,content);assert.equal(get().unitId,UNIT);assert.equal(get().submittedBy,ids.citizen)
assert.equal(state.reports.filter(r=>r.cluster==='CUM-001').length,3)
op('analyst',{type:'link',id:'PA-013',clusterId:'CUM-001'})
assert.equal(state.reports.filter(r=>r.cluster==='CUM-001').reduce((n,r)=>n+r.amount,0),60)
for(const who of ['reception','worker','leader','supervisor','admin'])denied(who,{type:'create-case',name:'Thử',clusterId:'CUM-001'})
op('analyst',{type:'create-case',name:'Hồ sơ đủ bốn phản ánh',clusterId:'CUM-001'})
assert.equal(state.cases[0].reportIds.length,4);assert.equal(state.cases[0].assignedTo,undefined)
const id=state.cases[0].id
for(const who of ['analyst','reception','worker','supervisor','admin'])denied(who,{type:'assign',id,assignedTo:ids.worker,priority:'Cao',directive:'Sai quyền'})
op('leader',{type:'assign',id,assignedTo:ids.worker,priority:'Cao',directive:'Xác minh tài liệu'})
denied('worker',{type:'work',id,note:'Chưa nhận việc',status:'Đang xác minh',content:'',attachment:false})
op('worker',{type:'case-accept',id})
denied('other',{type:'work',id,note:'Sai người',status:'Đang xác minh',content:'',attachment:false})
op('worker',{type:'work',id,note:'Nhận định đã lưu',status:'Đang xác minh',content:'Đối chiếu giao dịch',attachment:true})
op('worker',{type:'source-request',id,content:'Đề nghị phân tích xem lại số liên hệ'})
op('worker',{type:'report-draft',id,content:'Báo cáo bản một'})
op('worker',{type:'report-submit',id})
denied('worker',{type:'work',id,note:'Không được sửa lúc trình',status:'Đang xác minh',content:'',attachment:false})
denied('leader',{type:'report-review',id,approve:false,note:''})
op('leader',{type:'report-review',id,approve:false,note:'Bổ sung kết quả'})
op('worker',{type:'report-draft',id,content:'Báo cáo đã bổ sung'})
op('worker',{type:'report-submit',id})
for(const who of ['analyst','worker','reception','supervisor','admin'])denied(who,{type:'report-review',id,approve:true,note:''})
op('leader',{type:'report-review',id,approve:true,note:'Đã đối chiếu'})
const approved=structuredClone(state.cases[0].reportVersions[0])
denied('worker',{type:'report-draft',id,content:'Sửa đè bản duyệt'})
op('worker',{type:'report-draft',id,content:'Bản hai',newVersion:true})
op('worker',{type:'work',id,note:'Nhận định mới',status:'Chờ bổ sung',content:'',attachment:false})
assert.deepEqual(state.cases[0].reportVersions[0],approved);assert.equal(approved.snapshot.reports.length,4);assert.equal(approved.snapshot.note,'Nhận định đã lưu')
const foreign={...state.cases[0],id:'HS-KHAC',unitId:'Đơn vị B'},foreignReport={...get(),id:'PA-KHAC',unitId:'Đơn vị B',submittedBy:'nguoi.khac'}
for(const a of state.accounts){assert.equal(canReadCase(a,foreign),false);assert.equal(canReadReport(a,foreignReport,[foreign]),false)}
assert.equal(canReadReport(state.accounts[0],{...get(),submittedBy:undefined},state.cases),false)
const disabled={...state.accounts[1],active:false};assert.equal(permit(disabled,'report.create'),false)
for(const who of ['analyst','worker','leader','supervisor','citizen'])denied(who,{type:'account-update',id:ids.analyst,role:R.leader,unitId:UNIT,active:true})
denied('admin',{type:'account-update',id:ids.citizen,role:R.analyst,unitId:UNIT,active:true})
denied('admin',{type:'account-update',id:ids.admin,role:R.worker,unitId:UNIT,active:true})
op('admin',{type:'account-update',id:ids.analyst,role:R.leader,unitId:UNIT,active:true})
denied('analyst',{type:'extract-start',id:'PA-013'})
assert(audit.some(l=>l.user===ids.analyst&&l.role===R.analyst))
assert.equal(visibleLogs(state.accounts.find(a=>a.role===R.admin),audit).some(l=>l.action==='Xác nhận liên kết'),false)
const unknown=migrateCase({id:'OLD',name:'Cũ',priority:'Cao',officer:'Không rõ',status:'Mới tạo',updated:time,note:'Cũ',reportIds:['PA-001'],history:[]});assert.equal(unknown.assignedTo,undefined);assert.equal(unknown.officer,'Không rõ')
console.log(JSON.stringify({result:'PASS',checks:['per-action and per-role denials','intake handoff and separate supplements','no original testimony overwrite','review before link; cluster four/60','unassigned case then leader assignment','assigned worker only','draft-submit-reject-resubmit-approve','immutable approved snapshots and new versions','unit, citizen ownership and inactive accounts','real account role changes; historical audit roles','admin audit scope','legacy unknown assignee preserved']},null,2))
