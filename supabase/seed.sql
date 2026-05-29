-- Demo data for BennnSam. The API also ships with in-memory demo data for local UI work.

insert into public.tenants (id, name, slug) values
  ('00000000-0000-0000-0000-000000000001', 'Northstar Manufacturing', 'northstar')
on conflict (id) do nothing;

insert into public.business_units (id, tenant_id, name, executive_owner) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Technology', 'Ava Collins'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Product', 'Ben Martin'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Corporate', 'Marcus Tan'),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Revenue', 'Sofia Walsh'),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Risk', 'Noah Rivera')
on conflict (id) do nothing;

insert into public.departments (id, tenant_id, business_unit_id, name, cost_centre, manager) values
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'IT Operations', 'CC-100', 'Ava Collins'),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Engineering', 'CC-210', 'Ben Martin'),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Design', 'CC-330', 'Iris Chen'),
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Finance', 'CC-410', 'Marcus Tan'),
  ('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 'Security', 'CC-520', 'Noah Rivera')
on conflict (id) do nothing;

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ava.collins@demo.bennnsam.local', crypt('BennnSamDemo!2026', gen_salt('bf')), now(), '{"provider":"email","providers":["email"],"tenant_id":"00000000-0000-0000-0000-000000000001"}', '{"full_name":"Ava Collins"}', now(), now()),
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'marcus.tan@demo.bennnsam.local', crypt('BennnSamDemo!2026', gen_salt('bf')), now(), '{"provider":"email","providers":["email"],"tenant_id":"00000000-0000-0000-0000-000000000001"}', '{"full_name":"Marcus Tan"}', now(), now()),
  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'priya.singh@demo.bennnsam.local', crypt('BennnSamDemo!2026', gen_salt('bf')), now(), '{"provider":"email","providers":["email"],"tenant_id":"00000000-0000-0000-0000-000000000001"}', '{"full_name":"Priya Singh"}', now(), now())
on conflict (id) do nothing;

insert into public.users_profile (id, tenant_id, department_id, full_name, email, role, job_title) values
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Ava Collins', 'ava.collins@demo.bennnsam.local', 'Platform Admin', 'Head of IT Operations'),
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 'Marcus Tan', 'marcus.tan@demo.bennnsam.local', 'SAM Manager', 'Commercial Governance Lead'),
  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Priya Singh', 'priya.singh@demo.bennnsam.local', 'Licence Manager', 'Licence Analyst')
on conflict (id) do nothing;

insert into public.vendors (id, tenant_id, name, normalized_name, website, risk_rating) values
  ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Microsoft', 'microsoft', 'https://www.microsoft.com', 'medium'),
  ('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Adobe', 'adobe', 'https://www.adobe.com', 'low'),
  ('40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Autodesk', 'autodesk', 'https://www.autodesk.com', 'medium'),
  ('40000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Salesforce', 'salesforce', 'https://slack.com', 'medium'),
  ('40000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Zoom', 'zoom', 'https://zoom.us', 'medium'),
  ('40000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Atlassian', 'atlassian', 'https://www.atlassian.com', 'low'),
  ('40000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Figma', 'figma', 'https://www.figma.com', 'low'),
  ('40000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Canva', 'canva', 'https://www.canva.com', 'low'),
  ('40000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'GitHub', 'github', 'https://github.com', 'medium'),
  ('40000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Notion Labs', 'notion labs', 'https://www.notion.so', 'high')
on conflict (id) do nothing;

insert into public.applications (id, tenant_id, vendor_id, owner_id, department_id, name, category, app_type, version, edition, install_count, active_users, total_usage_minutes, active_usage_minutes, last_detected_date, licence_requirement, gdpr_risk, eol_date, upgrade_path, downgrade_path, tags, approved, monthly_cost, renewal_date, risk_rating) values
  ('50000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000004','Microsoft 365','Productivity','SaaS','Evergreen','E5',139,126,96400,72100,'2026-05-25','Named user subscription',true,null,'Add Copilot add-on for eligible makers','E3 for low security feature usage','{approved,tier-1,identity-linked}',true,7052,'2026-08-18','medium'),
  ('50000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000002',null,'20000000-0000-0000-0000-000000000003','Adobe Creative Cloud','Creative','SaaS','2026','All Apps',42,21,20870,10940,'2026-05-24','Named user subscription',false,null,'All Apps Pro for premium stock use','Single App for low breadth users','{approved,creative}',true,2520,'2026-07-12','low'),
  ('50000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000003',null,'20000000-0000-0000-0000-000000000002','AutoCAD','Engineering','desktop','2025.1','Commercial',18,8,11320,5820,'2026-05-22','Named user subscription',false,'2027-03-31','AutoCAD 2026','Viewer-only for occasional reviewers','{approved,specialist}',true,3042,'2026-06-30','medium'),
  ('50000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000004','30000000-0000-0000-0000-000000000001',null,'Slack','Collaboration','SaaS','Evergreen','Business+',98,91,68820,51940,'2026-05-26','Named user subscription',true,null,'Enterprise Grid for legal hold needs','Pro for non-regulated teams','{approved,collaboration}',true,1832,'2026-09-05','medium'),
  ('50000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000005','30000000-0000-0000-0000-000000000002',null,'Zoom','Meetings','SaaS','Evergreen','Business',88,54,32420,21120,'2026-05-26','Named host subscription',true,null,'Business Plus for phone add-on','Basic for viewers','{approved,meetings}',true,1320,'2026-07-28','medium'),
  ('50000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000006',null,'20000000-0000-0000-0000-000000000002','Jira','Work Management','SaaS','Cloud','Premium',64,58,42190,28770,'2026-05-25','Named user subscription',false,null,'Enterprise for cross-site controls','Standard for read-mostly teams','{approved,engineering}',true,960,'2026-11-15','low'),
  ('50000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000007',null,'20000000-0000-0000-0000-000000000003','Figma','Design','SaaS','Evergreen','Organization',31,27,51600,39700,'2026-05-26','Editor seat subscription',false,null,'Enterprise for advanced admin','Viewer for commenters','{approved,design}',true,1395,'2026-10-01','low'),
  ('50000000-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000008',null,'20000000-0000-0000-0000-000000000003','Canva','Design','SaaS','Evergreen','Teams',19,10,4120,1790,'2026-05-20','Named user subscription',false,null,'Enterprise brand controls','Free for ad-hoc viewers','{approved,brand}',true,285,'2026-06-20','low'),
  ('50000000-0000-0000-0000-000000000009','00000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000009',null,'20000000-0000-0000-0000-000000000002','GitHub Copilot','AI Development','AI tool','Business','Business',44,32,12680,9020,'2026-05-25','Named user subscription',true,null,'Enterprise for policy controls','Remove from inactive engineers','{approved,ai,developer}',true,836,'2026-09-18','medium'),
  ('50000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Windows Server','Operating System','server','2012 R2','Datacenter',11,0,74400,74400,'2026-05-18','Core-based server licensing',false,'2023-10-10','Windows Server 2022','Decommission idle legacy hosts','{server,eol}',true,1450,'2026-12-01','critical'),
  ('50000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001',null,'20000000-0000-0000-0000-000000000001','SQL Server','Database','server','2016 SP3','Standard',14,0,89200,89200,'2026-05-18','Core-based database licensing',true,'2026-07-14','SQL Server 2022','Consolidate low-utilization instances','{server,database,review}',true,4780,'2026-08-01','high'),
  ('50000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000010',null,'20000000-0000-0000-0000-000000000002','Notion','Knowledge Management','browser app','Evergreen','Plus',0,17,8420,5110,'2026-05-26','Named user subscription',true,null,'Business for SSO and audit logs','Free for personal drafts','{shadow-saas,knowledge}',false,170,'2026-06-15','high')
on conflict (id) do nothing;

insert into public.devices (id, tenant_id, assigned_user_id, department_id, hostname, os, os_version, last_check_in, cpu_architecture, installed_software, running_processes, browser_saas_usage_events, custom_attributes, serial_number, asset_tag, location, warranty_date, lifecycle_status, cost_centre, notes) values
  ('60000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','BSAM-WIN-014','Windows','11 24H2','2026-05-26 08:35:00+08','x64','["Microsoft 365","Slack","Zoom"]','["teams.exe","slack.exe","msedge.exe"]','["admin.microsoft.com","slack.com","portal.azure.com"]','{"registry_owner":"IT","local_cost_center":"CC-100","encryption":"enabled"}','SN-BSAM-014','AT-10014','Perth HQ','2027-05-14','active','CC-100','Primary admin workstation'),
  ('60000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001',null,'20000000-0000-0000-0000-000000000003','BSAM-MAC-021','macOS','15.5','2026-05-26 09:15:00+08','arm64','["Adobe Creative Cloud","Figma","Canva","Slack","Zoom"]','["Figma","Creative Cloud","Slack"]','["figma.com","canva.com","notion.so"]','{"file_metadata_team":"Brand Studio","local_cost_center":"CC-330","jamf_group":"Design Macs"}','C02BSAM021','AT-33021','Melbourne Studio','2026-11-30','active','CC-330','High-memory creative device'),
  ('60000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001',null,'20000000-0000-0000-0000-000000000002','BSAM-WIN-044','Windows','11 23H2','2026-05-25 17:28:00+08','x64','["Microsoft 365","Jira","GitHub Copilot","AutoCAD","Slack"]','["code.exe","acad.exe","copilot-agent.exe"]','["github.com","jira.demo.local","slack.com"]','{"registry_role":"engineering","local_cost_center":"CC-210","gpu":"RTX A2000"}','SN-BSAM-044','AT-21044','Perth HQ','2026-08-18','refresh due','CC-210','Refresh candidate due to warranty window'),
  ('60000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000001',null,'20000000-0000-0000-0000-000000000001','BSAM-SRV-007','Windows Server','2012 R2','2026-05-18 02:00:00+08','x64','["Windows Server","SQL Server"]','["sqlservr.exe","w3wp.exe"]','[]','{"registry_owner":"Legacy Apps","local_cost_center":"CC-110","backup_policy":"weekly"}','VM-BSAM-007','AT-11007','Azure Australia East','2026-12-31','refresh due','CC-110','Legacy database host with EOL operating system')
on conflict (id) do nothing;

insert into public.saas_domains (tenant_id, application_id, domain, approved, source)
select '00000000-0000-0000-0000-000000000001', id, domain, approved, 'seed'
from (
  values
    ('50000000-0000-0000-0000-000000000001'::uuid, 'office.com', true),
    ('50000000-0000-0000-0000-000000000004'::uuid, 'slack.com', true),
    ('50000000-0000-0000-0000-000000000007'::uuid, 'figma.com', true),
    ('50000000-0000-0000-0000-000000000008'::uuid, 'canva.com', true),
    ('50000000-0000-0000-0000-000000000012'::uuid, 'notion.so', false)
) as domain_seed(id, domain, approved)
on conflict (tenant_id, domain) do nothing;

insert into public.saas_detections (tenant_id, application_id, saas_app_name, domain, vendor, category, detected_users, assigned_users, paid_seats, active_users, inactive_users, monthly_cost, risk_rating, renewal_date, approved, source) values
  ('00000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','Microsoft 365','office.com','Microsoft','Productivity',132,142,150,126,24,7052,'medium','2026-08-18',true,'SSO import'),
  ('00000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000004','Slack','slack.com','Salesforce','Collaboration',94,108,110,91,19,1832,'medium','2026-09-05',true,'SSO import'),
  ('00000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000012','Notion','notion.so','Notion Labs','Knowledge Management',17,0,17,17,0,170,'high','2026-06-15',false,'browser import'),
  ('00000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000007','Figma','figma.com','Figma','Design',29,31,35,27,8,1395,'low','2026-10-01',true,'finance CSV'),
  ('00000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000008','Canva','canva.com','Canva','Design',18,22,25,10,15,285,'low','2026-06-20',true,'manual');

insert into public.contracts (id, tenant_id, vendor_id, name, owner_id, start_date, end_date, renewal_date, total_value, notes) values
  ('70000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','Microsoft Enterprise Renewal 2026','30000000-0000-0000-0000-000000000003','2025-08-18','2026-08-18','2026-08-18',123000,'Includes M365, SQL, Windows Server'),
  ('70000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000002','Creative Suite Team Plan',null,'2025-07-12','2026-07-12','2026-07-12',30240,'Creative department renewal'),
  ('70000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000003','Autodesk Engineering Seats',null,'2025-06-30','2026-06-30','2026-06-30',36504,'Engineering named users');

insert into public.licences (id, tenant_id, application_id, contract_id, sku, licence_metric, purchased_quantity, assigned_quantity, consumed_quantity, compliance_status, cost_per_licence, true_up_true_down_notes, calculation_rule) values
  ('80000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001','M365-E5','user',150,142,126,'over-licensed',47.01,'Review inactive E5 seats before August renewal.','Consumed = active assigned users in last 45 days.'),
  ('80000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000002','70000000-0000-0000-0000-000000000002','CC-ALL-APPS','user',45,42,21,'over-licensed',60,'Move 14 users to single-app plans.','Consumed = users with 60+ active minutes in 30 days.'),
  ('80000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000003','70000000-0000-0000-0000-000000000003','ACAD-COM','user',12,18,8,'under-licensed',169,'Assignments exceed purchased count.','Assigned named users cannot exceed purchased entitlement.'),
  ('80000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000011','70000000-0000-0000-0000-000000000001','SQL-STD-CORE','core',64,72,72,'under-licensed',74.69,'Legacy hosts need consolidation or true-up.','Consumed = active server cores with SQL service running.'),
  ('80000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000009',null,'COPILOT-BIZ','subscription',44,44,32,'over-licensed',19,'Remove add-on from inactive repository contributors.','Consumed = active IDE usage or suggestion acceptance in 30 days.');

insert into public.licence_entitlements (tenant_id, licence_id, entitlement_name, quantity, valid_from, valid_to, rights) values
  ('00000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000001','Microsoft 365 E5 seats',150,'2025-08-18','2026-08-18','{"online_services":true,"security_addons":true}'),
  ('00000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000002','Adobe Creative Cloud All Apps seats',45,'2025-07-12','2026-07-12','{"all_apps":true,"stock":false}'),
  ('00000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000003','AutoCAD named users',12,'2025-06-30','2026-06-30','{"named_user":true}'),
  ('00000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000004','SQL Server Standard cores',64,'2025-08-01','2026-08-01','{"failover_rights":true}');

insert into public.licence_assignments (tenant_id, licence_id, user_id, device_id, assignment_source, active) values
  ('00000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001',null,'Microsoft 365 integration',true),
  ('00000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000002',null,'Microsoft 365 integration',true),
  ('00000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000003',null,'60000000-0000-0000-0000-000000000003','manual import',true),
  ('00000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000004',null,'60000000-0000-0000-0000-000000000004','SCCM',true);

insert into public.application_aliases (tenant_id, application_id, alias, source, confidence_score) values
  ('00000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','MS Office 365 Apps','Intune',92),
  ('00000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000002','AdobeCC All','Jamf',85),
  ('00000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000011','sql std 13.x','SCCM',76);

insert into public.software_versions (tenant_id, application_id, version, edition, release_date, eol_date, upgrade_path, risk_rating) values
  ('00000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000003','2025.1','Commercial','2025-04-01','2027-03-31','AutoCAD 2026','medium'),
  ('00000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000010','2012 R2','Datacenter','2013-10-18','2023-10-10','Windows Server 2022','critical'),
  ('00000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000011','2016 SP3','Standard','2021-09-15','2026-07-14','SQL Server 2022','high');

insert into public.software_installations (tenant_id, device_id, application_id, installed_at, last_seen, install_path, source) values
  ('00000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','2025-03-02 09:00:00+08','2026-05-26 08:35:00+08','C:\Program Files\Microsoft Office','agent'),
  ('00000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000002','2025-11-14 09:00:00+08','2026-05-26 09:15:00+08','/Applications/Adobe Creative Cloud','agent'),
  ('00000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000003','50000000-0000-0000-0000-000000000003','2026-01-08 09:00:00+08','2026-05-25 17:28:00+08','C:\Program Files\Autodesk\AutoCAD 2025','agent'),
  ('00000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000004','50000000-0000-0000-0000-000000000011','2022-06-18 09:00:00+08','2026-05-18 02:00:00+08','C:\Program Files\Microsoft SQL Server','agent');

insert into public.raw_inventory_events (id, tenant_id, device_id, source, raw_name, raw_vendor, executable_name, folder_path, registry_key, process_name, file_metadata, payload, detected_at) values
  ('91000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000001','integration','MS Office 365 Apps','Microsoft','winword.exe','C:\Program Files\Microsoft Office','HKLM\Software\Microsoft\Office','winword.exe','{"product_version":"Evergreen"}','{"source":"Intune"}','2026-05-26 08:35:00+08'),
  ('91000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000002','agent','AdobeCC All','Adobe',null,'/Applications/Adobe Creative Cloud',null,'Creative Cloud','{"bundle_id":"com.adobe.acc"}','{"source":"Jamf"}','2026-05-26 09:15:00+08'),
  ('91000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000004','integration','sql std 13.x','Microsoft','sqlservr.exe','C:\Program Files\Microsoft SQL Server',null,'sqlservr.exe','{"major_version":"13"}','{"source":"SCCM"}','2026-05-18 02:00:00+08');

insert into public.normalization_review_queue (tenant_id, raw_inventory_event_id, suggested_application_id, vendor_suggestion, confidence_score, duplicate_candidates, status, analyst_id, override_history) values
  ('00000000-0000-0000-0000-000000000001','91000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','Microsoft',92,'["Microsoft Office","Office 365 ProPlus"]','pending',null,'[]'),
  ('00000000-0000-0000-0000-000000000001','91000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000002','Adobe',85,'["Adobe Creative Suite","Adobe CC"]','pending',null,'["2026-05-19: mapped from Adobe Suite by Priya Singh"]'),
  ('00000000-0000-0000-0000-000000000001','91000000-0000-0000-0000-000000000003','50000000-0000-0000-0000-000000000011','Microsoft',76,'["Microsoft SQL Server Standard"]','overridden','30000000-0000-0000-0000-000000000003','["2026-05-18: forced edition Standard after registry key match"]');

insert into public.usage_daily_summary (tenant_id, app_id, user_id, device_id, usage_date, active_minutes, total_minutes, event_count) values
  ('00000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000001','2026-05-24',286,470,1),
  ('00000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000003',null,'60000000-0000-0000-0000-000000000003','2026-05-22',88,490,1),
  ('00000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000012',null,'60000000-0000-0000-0000-000000000002','2026-05-25',34,50,1)
on conflict (tenant_id, app_id, user_id, device_id, usage_date) do nothing;

insert into public.cost_records (tenant_id, application_id, user_id, device_id, department_id, business_unit_id, monthly_cost, allocation_method, negotiated_price, notes) values
  ('00000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000002',null,'20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000003',47.01,'seat',47.01,'Finance M365 seat'),
  ('00000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000002',null,'60000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000002',60,'seat',52,'Negotiated creative seat'),
  ('00000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000003',null,'60000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002',169,'seat',null,'Engineering AutoCAD seat'),
  ('00000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000011',null,'60000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001',4780,'device',4300,'Legacy SQL host allocation');

insert into public.usage_events (tenant_id, app_id, user_id, device_id, event_type, started_at, ended_at, active_minutes, total_minutes, source) values
  ('00000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000001','process_open','2026-05-24 08:30:00+08','2026-05-24 16:20:00+08',286,470,'agent'),
  ('00000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000002',null,'60000000-0000-0000-0000-000000000002','process_open','2026-05-24 10:10:00+08','2026-05-24 15:05:00+08',211,295,'agent'),
  ('00000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000003',null,'60000000-0000-0000-0000-000000000003','process_open','2026-05-22 09:00:00+08','2026-05-22 17:10:00+08',88,490,'agent'),
  ('00000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000012',null,'60000000-0000-0000-0000-000000000002','browser_url','2026-05-25 11:10:00+08','2026-05-25 12:00:00+08',34,50,'agent');

insert into public.compliance_results (tenant_id, application_id, finding, category, severity, risk_score, owner_id, evidence, due_date) values
  ('00000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000003','AutoCAD assigned users exceed purchased entitlement','under-licensed','high',82,null,'18 assigned users vs 12 purchased seats.','2026-06-15'),
  ('00000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000010','Windows Server 2012 R2 remains in production','EOL','critical',96,'30000000-0000-0000-0000-000000000001','11 installations detected after vendor support end date.','2026-06-05'),
  ('00000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000012','Notion is used without application approval','unapproved SaaS','high',78,null,'17 active browser users, no approved application owner.','2026-06-10'),
  ('00000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000011','SQL Server has no named owner','missing owner','medium',61,null,'Owner field is blank for a high-cost database platform.','2026-06-21');

insert into public.savings_recommendations (tenant_id, application_id, department_id, recommendation_type, estimated_annual_savings, reason, status) values
  ('00000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000003','cancel unused',10080,'14 assigned users have under 30 active minutes in the last 30 days.','reviewing'),
  ('00000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000004','downgrade',6840,'Twelve E5 users use no advanced compliance or voice features.','new'),
  ('00000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000002','renewal prep',4056,'Five viewers can move to free viewer tooling before the June renewal.','new');

insert into public.integrations (tenant_id, name, category, connection_status, enabled, last_sync, mapping_config) values
  ('00000000-0000-0000-0000-000000000001','Microsoft Entra ID / Azure AD','identity','connected',true,'2026-05-26 06:10:00+08','[{"source":"userPrincipalName","target":"users_profile.email"},{"source":"assignedApp.displayName","target":"saas_detections.saas_app_name"}]'),
  ('00000000-0000-0000-0000-000000000001','Microsoft 365 licence assignments','identity','connected',true,'2026-05-26 06:22:00+08','[{"source":"skuPartNumber","target":"licence_entitlements.sku"}]'),
  ('00000000-0000-0000-0000-000000000001','Google Workspace','identity','not connected',false,null,'[{"source":"primaryEmail","target":"users_profile.email"}]'),
  ('00000000-0000-0000-0000-000000000001','Okta','identity','needs attention',true,'2026-05-24 21:15:00+08','[{"source":"app.label","target":"applications.name"}]'),
  ('00000000-0000-0000-0000-000000000001','ServiceNow CMDB','service management','connected',true,'2026-05-25 04:00:00+08','[{"source":"applications.name","target":"cmdb_ci_appl.name"}]'),
  ('00000000-0000-0000-0000-000000000001','Jira Assets','service management','not connected',false,null,'[{"source":"devices.assetTag","target":"object.assetTag"}]'),
  ('00000000-0000-0000-0000-000000000001','Intune','endpoint','connected',true,'2026-05-26 05:35:00+08','[{"source":"deviceName","target":"devices.hostname"}]'),
  ('00000000-0000-0000-0000-000000000001','Jamf','endpoint','connected',true,'2026-05-26 05:45:00+08','[{"source":"extensionAttributes.costCenter","target":"devices.cost_centre"}]'),
  ('00000000-0000-0000-0000-000000000001','SCCM','endpoint','needs attention',true,'2026-05-22 02:15:00+08','[{"source":"ARPDisplayName","target":"raw_inventory_events.raw_name"}]'),
  ('00000000-0000-0000-0000-000000000001','Finance/procurement CSV','finance','connected',true,'2026-05-25 17:00:00+08','[{"source":"supplier_name","target":"vendors.name"}]'),
  ('00000000-0000-0000-0000-000000000001','Custom REST API','api','not connected',false,null,'[{"source":"payload.software[].name","target":"raw_inventory_events.raw_name"}]');

insert into public.export_workflows (tenant_id, name, source_dataset, filters, mapped_fields, destination, schedule, enabled, execution_logs) values
  ('00000000-0000-0000-0000-000000000001','Approved apps to CMDB','applications','{"approved":true,"owner_required":true}','[{"source":"name","destination":"cmdb_ci_appl.name"},{"source":"owner","destination":"owned_by"}]','ServiceNow mock endpoint','daily',true,'[{"at":"2026-05-26T03:00:00+08:00","status":"success","records":10,"message":"CMDB payload accepted."}]'),
  ('00000000-0000-0000-0000-000000000001','Renewal report to Finance CSV','licences','{"renewal_window_days":90}','[{"source":"applicationName","destination":"Application"},{"source":"renewalDate","destination":"Renewal date"}]','CSV','weekly',true,'[{"at":"2026-05-25T07:00:00+08:00","status":"success","records":4,"message":"CSV generated for finance."}]');

insert into public.custom_inventory_rules (tenant_id, name, match_type, match_value, normalized_application_id, edition, classification, confidence, enabled) values
  ('00000000-0000-0000-0000-000000000001','AutoCAD executable','executable','acad.exe','50000000-0000-0000-0000-000000000003','Commercial','paid',98,true),
  ('00000000-0000-0000-0000-000000000001','Adobe CC folder','folder path','/Applications/Adobe Creative Cloud','50000000-0000-0000-0000-000000000002','All Apps','enterprise',93,true),
  ('00000000-0000-0000-0000-000000000001','Notion SaaS domain','SaaS domain','notion.so','50000000-0000-0000-0000-000000000012','Plus','paid',86,true),
  ('00000000-0000-0000-0000-000000000001','SQL service process','process name','sqlservr.exe','50000000-0000-0000-0000-000000000011','Standard','enterprise',91,true),
  ('00000000-0000-0000-0000-000000000001','GitHub Copilot agent','process name','copilot-agent.exe','50000000-0000-0000-0000-000000000009','Business','paid',88,true);

insert into public.reports (tenant_id, name, description, dataset, filters, export_formats, created_by) values
  ('00000000-0000-0000-0000-000000000001','Software inventory report','Normalized applications with install, owner, version, EOL, and risk fields.','applications','["type","vendor","owner","business unit","tags"]','{CSV,JSON}','30000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000001','SaaS usage report','Detected SaaS domains, assigned users, active users, inactive seats, and approvals.','saas_detections','["approved","risk rating","renewal window"]','{CSV,JSON}','30000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000001','Licence compliance report','Entitlements, assignments, consumption, and compliance status.','licence_entitlements','["vendor","metric","status","renewal date"]','{CSV,JSON}','30000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0000-000000000001','Cost optimisation report','Savings, downgrade, cancellation, and renewal preparation recommendations.','savings_recommendations','["department","status","saving threshold"]','{CSV,JSON}','30000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000001','Renewal report','Upcoming vendor and SKU renewals with owners and cost impact.','licences','["next 30/60/90 days","owner","vendor"]','{CSV,JSON}','30000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0000-000000000001','Shadow IT report','Apps used but not approved, including domain and user evidence.','saas_detections','["approved=false","risk rating","detected users"]','{CSV,JSON}','30000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000001','EOL software report','Software past or near end-of-life with devices and mitigation path.','applications','["EOL date","owner","severity"]','{CSV,JSON}','30000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000001','User software profile','Assigned, installed, and actively used applications by user.','usage_events','["user","department","active minutes"]','{CSV,JSON}','30000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000001','Device software profile','Device inventory with installed software, running processes, and custom attributes.','devices','["device","department","OS","last seen"]','{CSV,JSON}','30000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000001','Department cost report','Monthly and annualized software cost allocations by department and business unit.','cost_records','["department","business unit","vendor"]','{CSV,JSON}','30000000-0000-0000-0000-000000000002');

insert into public.audit_log (tenant_id, actor_id, action, entity_type, changes) values
  ('00000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','approved_application','application','{"application":"Figma"}'),
  ('00000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000003','updated_licence_rule','licence','{"application":"SQL Server"}'),
  ('00000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000002','created_export_workflow','export_workflow','{"workflow":"Renewal report to Finance CSV"}');

-- BennnCloudability demo seed data.
insert into public.cloud_providers (id, tenant_id, provider_code, name, enabled) values
  ('a1000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','AWS','Amazon Web Services',true),
  ('a1000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','Azure','Microsoft Azure',true),
  ('a1000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','GCP','Google Cloud Platform',true),
  ('a1000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000001','OCI','Oracle Cloud Infrastructure',true)
on conflict (tenant_id, provider_code) do nothing;

insert into public.cloud_accounts (id, tenant_id, provider_id, account_external_id, account_name, owner_id, team, application, environment, cost_centre) values
  ('a2000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','123456789012','AWS Production','30000000-0000-0000-0000-000000000001','Platform','Customer Portal','Production','CC-100'),
  ('a2000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002','sub-eng-6ac4','Azure Engineering',null,'Engineering','Build Farm','Development','CC-210'),
  ('a2000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000003','northstar-analytics','GCP Analytics','30000000-0000-0000-0000-000000000002','Analytics','Finance Analytics','Production','CC-410'),
  ('a2000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000004','ocid1.tenancy.demo','OCI ERP','30000000-0000-0000-0000-000000000003','ERP','ERP Core','Production','CC-110')
on conflict (tenant_id, provider_id, account_external_id) do nothing;

insert into public.cloud_connections (id, tenant_id, provider_id, cloud_account_id, connection_name, auth_method, settings, enabled, last_sync_at, last_sync_status) values
  ('a3000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','a2000000-0000-0000-0000-000000000001','AWS CUR and Cost Explorer','Assume role placeholder','{"external_id":"bennncloudability-demo"}',true,'2026-05-29 03:20:00+08','Success'),
  ('a3000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002','a2000000-0000-0000-0000-000000000002','Azure Cost Management','Service principal placeholder','{}',true,'2026-05-29 03:35:00+08','Success'),
  ('a3000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000003','a2000000-0000-0000-0000-000000000003','GCP Billing Export','Service account placeholder','{}',true,'2026-05-29 04:05:00+08','Success'),
  ('a3000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000004','a2000000-0000-0000-0000-000000000004','OCI Usage API','API signing key placeholder','{}',false,'2026-05-27 22:15:00+08','Token review');

insert into public.cloud_resources (id, tenant_id, provider_id, cloud_account_id, provider_resource_id, resource_name, resource_type, service_name, region, sku, owner, team, application, environment, cost_centre, tags, labels, first_seen_at, last_seen_at) values
  ('a4000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','a2000000-0000-0000-0000-000000000001','i-0apiworker01','prd-api-worker-01','Compute instance','EC2','ap-southeast-2','m6i.2xlarge','Ava Collins','Platform','Customer Portal','Production','CC-100','{"application":"customer-portal","env":"prod","owner":"platform"}','{}','2026-01-04 00:00:00+08','2026-05-29 03:20:00+08'),
  ('a4000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002','a2000000-0000-0000-0000-000000000002','/subscriptions/sub-eng-6ac4/vm/dev-build-agent-03','dev-build-agent-03','Compute instance','Virtual Machines','australiaeast','Standard_D2s_v5','Ben Martin','Engineering','Build Farm','Development','CC-210','{"application":"build-farm","env":"dev"}','{}','2026-03-08 00:00:00+08','2026-05-29 03:35:00+08'),
  ('a4000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000003','a2000000-0000-0000-0000-000000000003','northstar-analytics.finance_mart','finance-mart','Warehouse','BigQuery','australia-southeast1','On demand','Sofia Walsh','Analytics','Finance Analytics','Production','CC-410','{"application":"finance-analytics","env":"prod"}','{}','2026-02-10 00:00:00+08','2026-05-29 04:05:00+08'),
  ('a4000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000004','a2000000-0000-0000-0000-000000000004','ocid1.instance.erpnode02','erp-app-node-02','Compute instance','Compute','ap-sydney-1','VM.Standard.E4.Flex-8','Priya Singh','ERP','ERP Core','Production','CC-110','{"application":"erp-core"}','{}','2026-01-15 00:00:00+08','2026-05-27 22:15:00+08')
on conflict (tenant_id, provider_id, provider_resource_id) do nothing;

insert into public.cloud_billing_records (tenant_id, provider_id, cloud_account_id, cloud_resource_id, provider, account_identifier, region, service, resource_id, resource_name, resource_type, sku, usage_quantity, usage_unit, cost, currency, billing_period, tags, owner, team, application, environment, cost_centre) values
  ('00000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','a2000000-0000-0000-0000-000000000001','a4000000-0000-0000-0000-000000000001','AWS','123456789012','ap-southeast-2','EC2','i-0apiworker01','prd-api-worker-01','Compute instance','m6i.2xlarge',720,'hours',1480,'AUD','2026-05-01','{"application":"customer-portal","env":"prod"}','Ava Collins','Platform','Customer Portal','Production','CC-100'),
  ('00000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002','a2000000-0000-0000-0000-000000000002','a4000000-0000-0000-0000-000000000002','Azure','sub-eng-6ac4','australiaeast','Virtual Machines','dev-build-agent-03','dev-build-agent-03','Compute instance','Standard_D2s_v5',720,'hours',360,'AUD','2026-05-01','{"application":"build-farm","env":"dev"}','Ben Martin','Engineering','Build Farm','Development','CC-210'),
  ('00000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000003','a2000000-0000-0000-0000-000000000003','a4000000-0000-0000-0000-000000000003','GCP','northstar-analytics','australia-southeast1','BigQuery','finance-mart','finance-mart','Warehouse','On demand',41,'TB scanned',8640,'AUD','2026-05-01','{"application":"finance-analytics","env":"prod"}','Sofia Walsh','Analytics','Finance Analytics','Production','CC-410'),
  ('00000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000004','a2000000-0000-0000-0000-000000000004','a4000000-0000-0000-0000-000000000004','OCI','ocid1.tenancy.demo','ap-sydney-1','Compute','erp-app-node-02','erp-app-node-02','Compute instance','VM.Standard.E4.Flex-8',720,'hours',930,'AUD','2026-05-01','{"application":"erp-core"}','Priya Singh','ERP','ERP Core','Production','CC-110');

insert into public.cloud_resource_metrics (tenant_id, cloud_resource_id, metric_date, cpu_p95, cpu_p99, memory_p95, running_hours_30d, non_prod_after_hours_percent, storage_used_percent) values
  ('00000000-0000-0000-0000-000000000001','a4000000-0000-0000-0000-000000000001','2026-05-29',11,24,42,720,null,null),
  ('00000000-0000-0000-0000-000000000001','a4000000-0000-0000-0000-000000000002','2026-05-29',88,97,null,720,61,null),
  ('00000000-0000-0000-0000-000000000001','a4000000-0000-0000-0000-000000000003','2026-05-29',58,76,null,720,null,null),
  ('00000000-0000-0000-0000-000000000001','a4000000-0000-0000-0000-000000000004','2026-05-29',14,28,49,720,null,null)
on conflict (tenant_id, cloud_resource_id, metric_date) do nothing;

insert into public.cloud_rightsizing_recommendations (tenant_id, cloud_resource_id, recommendation_type, current_sku, recommended_sku, reason, supporting_metrics, estimated_monthly_saving, estimated_annual_saving, confidence_score, risk_score, status) values
  ('00000000-0000-0000-0000-000000000001','a4000000-0000-0000-0000-000000000001','Downsize oversized compute','m6i.2xlarge','m6i.xlarge','p95 and p99 utilisation remain materially below policy thresholds.','{"cpu_p95":11,"cpu_p99":24,"memory_p95":42}',562,6744,86,34,'New'),
  ('00000000-0000-0000-0000-000000000001','a4000000-0000-0000-0000-000000000002','Upsize under-provisioned compute','Standard_D2s_v5','Standard_D4s_v5','Sustained high p95/p99 CPU indicates performance risk.','{"cpu_p95":88,"cpu_p99":97,"memory":"unavailable"}',-79,-948,79,68,'Reviewing'),
  ('00000000-0000-0000-0000-000000000001','a4000000-0000-0000-0000-000000000004','Downsize oversized compute','VM.Standard.E4.Flex-8','VM.Standard.E4.Flex-4','p95 and p99 utilisation remain materially below policy thresholds.','{"cpu_p95":14,"cpu_p99":28,"memory_p95":49}',353,4236,86,34,'New');

insert into public.cloud_budgets (tenant_id, scope_type, scope_value, budget_amount, actual_spend, forecast_spend, burn_rate, alert_threshold, period_start, period_end) values
  ('00000000-0000-0000-0000-000000000001','team','Platform',82000,74820,79600,94,90,'2026-05-01','2026-05-31'),
  ('00000000-0000-0000-0000-000000000001','team','Engineering',62000,67950,70400,114,90,'2026-05-01','2026-05-31'),
  ('00000000-0000-0000-0000-000000000001','application','Finance Analytics',36000,41370,45200,126,85,'2026-05-01','2026-05-31');

insert into public.cloud_anomalies (tenant_id, provider_id, detected_at, affected_service, affected_owner_team, expected_cost, actual_cost, variance, likely_driver, status) values
  ('00000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000003','2026-05-22','BigQuery','Analytics',1410,3120,1710,'Finance mart backfill scanned 18 TB more than baseline.','Reviewing'),
  ('00000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002','2026-05-18','Microsoft Sentinel','Security',950,1840,890,'Diagnostic logs duplicated from firewall workspace.','New');

insert into public.cloud_reports (tenant_id, name, description, dataset, filters, export_formats, schedule, created_by) values
  ('00000000-0000-0000-0000-000000000001','Executive Cloud Summary','Board-ready cloud spend, forecast, variance and savings summary.','cloud_billing_records','["period","provider","team"]','{CSV,XLSX,PDF}','monthly','30000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000001','Rightsizing Opportunities','p95/p99 based recommendations with confidence, risk and savings.','cloud_rightsizing_recommendations','["provider","status","risk"]','{CSV,XLSX,PDF}','weekly','30000000-0000-0000-0000-000000000003');
