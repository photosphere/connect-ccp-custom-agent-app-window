const { ipcRenderer } = require('electron');

// 存储区域数据
let regions = [];
// 当前编辑的区域索引
let currentEditIndex = -1;
// 标记已删除的区域
let deletedRegions = [];
// 存储原始区域数据，用于比较变更
let originalRegions = [];

// 区域数据源
const regionOptions = [
    {
        "Region": "us-east-1",
        "FriendlyName": "美国东部（弗吉尼亚北部）"
    },
    {
        "Region": "us-west-2",
        "FriendlyName": "美国西部（俄勒冈）"
    },
    {
        "Region": "ca-central-1",
        "FriendlyName": "加拿大（中央）"
    },
    {
        "Region": "eu-west-2",
        "FriendlyName": "欧洲（伦敦）"
    },
    {
        "Region": "eu-central-1",
        "FriendlyName": "欧洲（法兰克福）"
    },
    {
        "Region": "ap-southeast-1",
        "FriendlyName": "亚太地区（新加坡）"
    },
    {
        "Region": "ap-southeast-2",
        "FriendlyName": "亚太地区（悉尼）"
    },
    {
        "Region": "ap-northeast-1",
        "FriendlyName": "亚太地区（东京）"
    },
    {
        "Region": "ap-northeast-2",
        "FriendlyName": "亚太地区（首尔）"
    },
    {
        "Region": "sa-east-1",
        "FriendlyName": "南美洲（圣保罗）"
    }
];

// DOM元素
const regionTableBody = document.getElementById('regionTableBody');
const editForm = document.getElementById('editForm');
const overlay = document.getElementById('overlay');
const formTitle = document.getElementById('formTitle');
const regionId = document.getElementById('regionId');
const regionLabel = document.getElementById('regionLabel');
const regionUrl = document.getElementById('regionUrl');
const regionTitle = document.getElementById('regionTitle');

// 按钮
const addRegionBtn = document.getElementById('addRegion');
const cancelEditBtn = document.getElementById('cancelEdit');
const saveEditBtn = document.getElementById('saveEdit');
const cancelButton = document.getElementById('cancelButton');
const saveButton = document.getElementById('saveButton');

// 初始化：接收主进程发送的区域数据
ipcRenderer.on('init-regions', (event, data) => {
  originalRegions = JSON.parse(JSON.stringify(data)); // 深拷贝原始数据
  regions = JSON.parse(JSON.stringify(data)); // 深拷贝
  renderRegionsTable();
  populateRegionDropdown();
});

// 填充区域下拉框
function populateRegionDropdown() {
  // 清空现有选项，保留第一个默认选项
  while (regionId.options.length > 1) {
    regionId.remove(1);
  }
  
  // 添加新选项
  regionOptions.forEach(option => {
    const optionElement = document.createElement('option');
    optionElement.value = option.Region;
    optionElement.textContent = `${option.Region} - ${option.FriendlyName}`;
    regionId.appendChild(optionElement);
  });
  
  // 添加区域ID变化事件监听
  regionId.addEventListener('change', updateLabelFromRegion);
}

// 根据选择的区域更新标签
function updateLabelFromRegion() {
  const selectedRegion = regionId.value;
  const regionInfo = regionOptions.find(option => option.Region === selectedRegion);
  
  if (regionInfo) {
    regionLabel.value = regionInfo.FriendlyName;
  } else {
    regionLabel.value = '';
  }
}

// 渲染区域表格
function renderRegionsTable() {
  regionTableBody.innerHTML = '';
  
  regions.forEach((region, index) => {
    const row = document.createElement('tr');
    
    // ID列
    const idCell = document.createElement('td');
    idCell.textContent = region.id;
    row.appendChild(idCell);
    
    // 标签列
    const labelCell = document.createElement('td');
    labelCell.textContent = region.label;
    row.appendChild(labelCell);
    
    // URL列
    const urlCell = document.createElement('td');
    urlCell.textContent = region.url;
    row.appendChild(urlCell);
    
    // 标题列
    const titleCell = document.createElement('td');
    titleCell.textContent = region.title;
    row.appendChild(titleCell);
    
    // 操作列
    const actionCell = document.createElement('td');
    actionCell.className = 'action-cell';
    
    // 编辑按钮
    const editButton = document.createElement('button');
    editButton.textContent = '编辑';
    editButton.className = 'btn-primary btn-sm';
    editButton.style.marginRight = '5px';
    editButton.addEventListener('click', () => editRegion(index));
    actionCell.appendChild(editButton);
    
    // 删除按钮
    const deleteButton = document.createElement('button');
    deleteButton.textContent = '删除';
    deleteButton.className = 'btn-danger btn-sm';
    deleteButton.addEventListener('click', () => deleteRegion(index));
    actionCell.appendChild(deleteButton);
    
    row.appendChild(actionCell);
    regionTableBody.appendChild(row);
  });
}

// 编辑区域
function editRegion(index) {
  currentEditIndex = index;
  const region = regions[index];
  
  formTitle.textContent = '编辑区域';
  regionId.value = region.id;
  regionLabel.value = region.label;
  regionUrl.value = region.url;
  regionTitle.value = region.title;
  
  // 显示编辑表单和遮罩层
  editForm.style.display = 'block';
  overlay.style.display = 'block';
}

// 删除区域
function deleteRegion(index) {
  const regionToDelete = regions[index];
  const confirmMessage = `确定要删除区域 "${regionToDelete.label}" (${regionToDelete.id}) 吗？`;
  
  if (confirm(confirmMessage)) {
    // 如果是已有的区域，记录到删除列表中
    if (regions[index].originalIndex !== undefined) {
      deletedRegions.push(regions[index].originalIndex);
    }
    
    regions.splice(index, 1);
    renderRegionsTable();
  }
}

// 新增区域
addRegionBtn.addEventListener('click', () => {
  currentEditIndex = -1;
  formTitle.textContent = '新增区域';
  
  regionId.value = '';
  regionLabel.value = '';
  regionUrl.value = '';
  regionTitle.value = '';
  
  // 显示编辑表单和遮罩层
  editForm.style.display = 'block';
  overlay.style.display = 'block';
});

// 取消编辑
cancelEditBtn.addEventListener('click', () => {
  // 隐藏编辑表单和遮罩层
  editForm.style.display = 'none';
  overlay.style.display = 'none';
});

// 保存编辑
saveEditBtn.addEventListener('click', () => {
  // 验证表单
  if (!regionId.value.trim()) {
    alert('请选择区域ID');
    return;
  }
  
  const regionData = {
    id: regionId.value.trim(),
    label: regionLabel.value.trim(),
    url: regionUrl.value.trim(),
    title: regionTitle.value.trim() || regionLabel.value.trim() // 如果标题为空，使用标签值
  };
  
  if (currentEditIndex === -1) {
    // 新增
    regions.push(regionData);
  } else {
    // 编辑，保留原始索引
    if (regions[currentEditIndex].originalIndex !== undefined) {
      regionData.originalIndex = regions[currentEditIndex].originalIndex;
    }
    regions[currentEditIndex] = regionData;
  }
  
  renderRegionsTable();
  // 隐藏编辑表单和遮罩层
  editForm.style.display = 'none';
  overlay.style.display = 'none';
});

// 取消按钮
cancelButton.addEventListener('click', () => {
  ipcRenderer.send('close-config');
});

// 保存按钮
saveButton.addEventListener('click', () => {
  // 处理数据以去除不需要的属性
  const cleanRegions = regions.map(region => ({
    id: region.id,
    label: region.label,
    url: region.url,
    title: region.title,
    originalIndex: region.originalIndex
  }));
  
  ipcRenderer.send('save-regions', { regions: cleanRegions, deletedRegions });
});