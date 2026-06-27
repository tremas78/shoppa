// ══════════════════════════════════════════════
//  DATA
// ══════════════════════════════════════════════
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const DAY_EMOJIS = ['☀️','🌤️','⛅','🌥️','🎉','🌟','☕'];
const MEAL_SLOTS = [
  { key: 'dinner', label: '🍽️ Dinner' }
];

let state = {
  meals: [],
  week: {},       // { Monday: { lunch: mealId, dinner: mealId }, ... }
  shopping: []    // [{ id, name, source, checked }]
};

let modalContext = null; // { mealId, day, slotKey }

function loadState() {
  const saved = localStorage.getItem('mealplanner_v2');
  if (saved) {
    state = JSON.parse(saved);
  } else {
    state = getDefaultState();
  }
  DAYS.forEach(d => { if (!state.week[d]) state.week[d] = {}; });
}

function saveState() {
  localStorage.setItem('mealplanner_v2', JSON.stringify(state));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function getDefaultState() {
  return {
    meals: [
      { id: uid(), emoji: '🍝', name: 'Spaghetti Bolognese', ingredients: [
        { id: uid(), name: 'Spaghetti', qty: '400g' },
        { id: uid(), name: 'Beef mince', qty: '500g' },
        { id: uid(), name: 'Tinned tomatoes', qty: '2 tins' },
        { id: uid(), name: 'Onion', qty: '1' },
        { id: uid(), name: 'Garlic', qty: '3 cloves' },
        { id: uid(), name: 'Red wine', qty: '100ml' },
      ]},
      { id: uid(), emoji: '🍛', name: 'Chicken Curry', ingredients: [
        { id: uid(), name: 'Chicken thighs', qty: '600g' },
        { id: uid(), name: 'Coconut milk', qty: '400ml' },
        { id: uid(), name: 'Curry paste', qty: '3 tbsp' },
        { id: uid(), name: 'Onion', qty: '1' },
        { id: uid(), name: 'Rice', qty: '300g' },
      ]},
      { id: uid(), emoji: '🥗', name: 'Caesar Salad', ingredients: [
        { id: uid(), name: 'Romaine lettuce', qty: '1 head' },
        { id: uid(), name: 'Parmesan', qty: '50g' },
        { id: uid(), name: 'Croutons', qty: 'handful' },
        { id: uid(), name: 'Caesar dressing', qty: '4 tbsp' },
        { id: uid(), name: 'Chicken breast', qty: '2' },
      ]},
      { id: uid(), emoji: '🍕', name: 'Homemade Pizza', ingredients: [
        { id: uid(), name: 'Pizza dough', qty: '500g' },
        { id: uid(), name: 'Passata', qty: '200g' },
        { id: uid(), name: 'Mozzarella', qty: '250g' },
        { id: uid(), name: 'Mixed toppings', qty: 'as desired' },
      ]},
      { id: uid(), emoji: '🥘', name: 'Veggie Stir Fry', ingredients: [
        { id: uid(), name: 'Egg noodles', qty: '300g' },
        { id: uid(), name: 'Mixed veg', qty: '400g' },
        { id: uid(), name: 'Soy sauce', qty: '3 tbsp' },
        { id: uid(), name: 'Sesame oil', qty: '1 tbsp' },
        { id: uid(), name: 'Ginger', qty: '1 thumb' },
      ]},
      { id: uid(), emoji: '🫕', name: 'Beef Stew', ingredients: [
        { id: uid(), name: 'Stewing beef', qty: '600g' },
        { id: uid(), name: 'Carrots', qty: '3' },
        { id: uid(), name: 'Potatoes', qty: '4' },
        { id: uid(), name: 'Beef stock', qty: '500ml' },
        { id: uid(), name: 'Onion', qty: '2' },
        { id: uid(), name: 'Tomato purée', qty: '2 tbsp' },
      ]},
    ],
    week: {},
    shopping: []
  };
}

// ══════════════════════════════════════════════
//  TABS
// ══════════════════════════════════════════════
function switchTab(name) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('panel-' + name).classList.add('active');
  document.getElementById('tab-' + name).classList.add('active');
  if (name === 'shopping') { renderShopping(); updateKeepPreview(); }
  if (name === 'planner') renderPlanner();
  if (name === 'meals') renderMeals();
}

// ══════════════════════════════════════════════
//  WEEK PLANNER
// ══════════════════════════════════════════════
function renderPlanner() {
  const grid = document.getElementById('week-grid');
  grid.innerHTML = '';

  DAYS.forEach((day, di) => {
    const dayData = state.week[day] || {};
    const card = document.createElement('div');
    card.className = 'day-card';

    let slotsHtml = MEAL_SLOTS.map((slot, si) => {
      const chosen = dayData[slot.key] || '';
      const options = state.meals.map(m =>
        `<option value="${m.id}" ${chosen === m.id ? 'selected' : ''}>${m.emoji} ${m.name}</option>`
      ).join('');
      return `
        <div class="meal-slot">
          <span class="meal-slot-label">${slot.label}</span>
          <select onchange="setMeal('${day}','${slot.key}',this.value)">
            <option value="">— pick a meal —</option>
            ${options}
          </select>
          ${chosen ? `<button class="add-to-list-btn" onclick="openIngredientModal('${chosen}','${day}','${slot.key}')">🛒 Add</button>` : ''}
        </div>
        ${si < MEAL_SLOTS.length - 1 ? '<div class="day-divider"></div>' : ''}
      `;
    }).join('');

    card.innerHTML = `
      <div class="day-header">
        <span class="day-name">${DAY_EMOJIS[di]} ${day}</span>
        <button class="day-clear-btn" onclick="clearDay('${day}')" title="Clear day">✕</button>
      </div>
      <div class="day-body">${slotsHtml}</div>
    `;
    grid.appendChild(card);
  });
}

function setMeal(day, slot, mealId) {
  if (!state.week[day]) state.week[day] = {};
  state.week[day][slot] = mealId;
  saveState();
  renderPlanner();
}

function clearDay(day) {
  state.week[day] = {};
  saveState();
  renderPlanner();
}

// ══════════════════════════════════════════════
//  INGREDIENT MODAL
// ══════════════════════════════════════════════
function openIngredientModal(mealId, day, slotKey) {
  const meal = state.meals.find(m => m.id === mealId);
  if (!meal) return;

  modalContext = { mealId, day, slotKey };

  document.getElementById('modal-title').textContent = `🛒 ${meal.emoji} ${meal.name}`;
  const list = document.getElementById('modal-ingr-list');
  list.innerHTML = '';

  if (!meal.ingredients.length) {
    list.innerHTML = '<p style="color:var(--text2);font-size:0.85rem;">No ingredients listed for this meal.</p>';
    return;
  }

  // Add a "Select All" checkbox at the top
  const selectAllRow = document.createElement('div');
  selectAllRow.className = 'modal-ingr-item';
  selectAllRow.style.background = 'var(--surface2)';
  selectAllRow.style.border = '1.5px solid var(--accent1)';
  selectAllRow.innerHTML = `
    <input type="checkbox" id="select-all-ingredients" onchange="toggleAllIngredients(this.checked)">
    <label for="select-all-ingredients" style="font-weight:600;">✅ Select All</label>
    <span style="font-size:0.78rem;color:var(--text2);margin-left:auto;">${meal.ingredients.length} items</span>
  `;
  list.appendChild(selectAllRow);

  meal.ingredients.forEach(ing => {
    const row = document.createElement('div');
    row.className = 'modal-ingr-item';
    row.innerHTML = `
      <input type="checkbox" id="ing_${ing.id}" value="${ing.id}">
      <label for="ing_${ing.id}">${ing.name}</label>
      <span class="modal-ingr-qty">${ing.qty || ''}</span>
    `;
    list.appendChild(row);
  });

  document.getElementById('modal-overlay').classList.add('open');
}

function toggleAllIngredients(checked) {
  const checkboxes = document.querySelectorAll('#modal-ingr-list input[type="checkbox"]');
  checkboxes.forEach(cb => {
    if (cb.id !== 'select-all-ingredients') {
      cb.checked = checked;
    }
  });
}

function closeModal(e) {
  if (e.target === document.getElementById('modal-overlay')) closeModalDirect();
}
function closeModalDirect() {
  document.getElementById('modal-overlay').classList.remove('open');
  modalContext = null;
}

function confirmIngredients() {
  if (!modalContext) return;
  const meal = state.meals.find(m => m.id === modalContext.mealId);
  if (!meal) return;

  const checkboxes = document.querySelectorAll('#modal-ingr-list input[type="checkbox"]:checked');
  let added = 0;

  checkboxes.forEach(cb => {
    const ing = meal.ingredients.find(i => i.id === cb.value);
    if (!ing) return;
    const label = ing.qty ? `${ing.name} (${ing.qty})` : ing.name;
    // Don't duplicate same item+source
    const exists = state.shopping.some(s => s.name === label && s.source === meal.name);
    if (!exists) {
      state.shopping.push({ id: uid(), name: label, source: meal.name, checked: false });
      added++;
    }
  });

  saveState();
  closeModalDirect();
  showToast(added > 0 ? `✅ Added ${added} ingredient${added>1?'s':''} to list` : '⚠️ No new items added');
  if (added > 0) {
    document.getElementById('tab-shopping').style.animation = 'none';
  }
}

// ══════════════════════════════════════════════
//  MEALS EDITOR
// ══════════════════════════════════════════════
function renderMeals() {
  const list = document.getElementById('meals-list');
  list.innerHTML = '';

  if (!state.meals.length) {
    list.innerHTML = '<div class="empty-state"><span class="empty-emoji">🍽️</span>No meals yet. Add one!</div>';
    return;
  }

  state.meals.forEach((meal, mi) => {
    const card = document.createElement('div');
    card.className = 'meal-card';
    card.id = 'meal-card-' + meal.id;

    const ingHtml = meal.ingredients.map(ing => `
      <div class="ingredient-row" id="ingrow-${ing.id}">
        <input class="qty-input" type="text" placeholder="qty" value="${ing.qty||''}" oninput="updateIngredient('${meal.id}','${ing.id}','qty',this.value)">
        <input type="text" placeholder="Ingredient name" value="${ing.name}" oninput="updateIngredient('${meal.id}','${ing.id}','name',this.value)">
        <button class="del-btn" onclick="deleteIngredient('${meal.id}','${ing.id}')">🗑️</button>
      </div>
    `).join('');

    card.innerHTML = `
      <div class="meal-card-header" onclick="toggleMealCard('${meal.id}')">
        <span class="meal-emoji-badge">${meal.emoji}</span>
        <span class="meal-card-title">${meal.name}</span>
        <span class="meal-card-count">${meal.ingredients.length} ingr.</span>
        <span class="meal-card-toggle">▼</span>
      </div>
      <div class="meal-card-body">
        <div class="meal-name-row">
          <input class="emoji-input" type="text" value="${meal.emoji}" placeholder="🍽️" maxlength="4" oninput="updateMealField('${meal.id}','emoji',this.value)">
          <input type="text" value="${meal.name}" placeholder="Meal name" oninput="updateMealField('${meal.id}','name',this.value)">
        </div>
        <p class="ingredients-label">🧂 Ingredients</p>
        <div id="inglist-${meal.id}">${ingHtml}</div>
        <button class="add-ingredient-btn" onclick="addIngredient('${meal.id}')">➕ Add ingredient</button>
        <div class="meal-action-row">
          <button class="btn btn-danger" onclick="deleteMeal('${meal.id}')">🗑️ Delete meal</button>
          <button class="btn btn-primary" onclick="saveMealCard('${meal.id}')">💾 Save</button>
        </div>
      </div>
    `;
    list.appendChild(card);
  });
}

function toggleMealCard(id) {
  const card = document.getElementById('meal-card-' + id);
  card.classList.toggle('open');
}

function updateMealField(mealId, field, value) {
  const meal = state.meals.find(m => m.id === mealId);
  if (meal) meal[field] = value;
}

function updateIngredient(mealId, ingId, field, value) {
  const meal = state.meals.find(m => m.id === mealId);
  if (!meal) return;
  const ing = meal.ingredients.find(i => i.id === ingId);
  if (ing) ing[field] = value;
}

function addIngredient(mealId) {
  const meal = state.meals.find(m => m.id === mealId);
  if (!meal) return;
  const newIng = { id: uid(), name: '', qty: '' };
  meal.ingredients.push(newIng);

  const list = document.getElementById('inglist-' + mealId);
  const row = document.createElement('div');
  row.className = 'ingredient-row';
  row.id = 'ingrow-' + newIng.id;
  row.innerHTML = `
    <input class="qty-input" type="text" placeholder="qty" value="" oninput="updateIngredient('${mealId}','${newIng.id}','qty',this.value)">
    <input type="text" placeholder="Ingredient name" value="" oninput="updateIngredient('${mealId}','${newIng.id}','name',this.value)">
    <button class="del-btn" onclick="deleteIngredient('${mealId}','${newIng.id}')">🗑️</button>
  `;
  list.appendChild(row);
  row.querySelector('input[type="text"]:not(.qty-input)').focus();
}

function deleteIngredient(mealId, ingId) {
  const meal = state.meals.find(m => m.id === mealId);
  if (!meal) return;
  meal.ingredients = meal.ingredients.filter(i => i.id !== ingId);
  const row = document.getElementById('ingrow-' + ingId);
  if (row) row.remove();
}

function saveMealCard(mealId) {
  saveState();
  const card = document.getElementById('meal-card-' + mealId);
  // Update header badge
  const meal = state.meals.find(m => m.id === mealId);
  if (meal) {
    card.querySelector('.meal-emoji-badge').textContent = meal.emoji;
    card.querySelector('.meal-card-title').textContent = meal.name;
    card.querySelector('.meal-card-count').textContent = meal.ingredients.length + ' ingr.';
  }
  showToast('💾 Meal saved!');
}

function deleteMeal(mealId) {
  if (!confirm('Delete this meal? It will also be removed from your week plan.')) return;
  state.meals = state.meals.filter(m => m.id !== mealId);
  DAYS.forEach(d => {
    MEAL_SLOTS.forEach(s => {
      if (state.week[d] && state.week[d][s.key] === mealId) delete state.week[d][s.key];
    });
  });
  saveState();
  renderMeals();
  showToast('🗑️ Meal deleted');
}

function addNewMeal() {
  const newMeal = { id: uid(), emoji: '🍽️', name: '', ingredients: [] };
  state.meals.push(newMeal);
  saveState();
  renderMeals();
  // Open the new card
  const card = document.getElementById('meal-card-' + newMeal.id);
  if (card) {
    card.classList.add('open');
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
      const nameInput = card.querySelector('.meal-name-row input[type="text"]');
      if (nameInput) { nameInput.focus(); nameInput.select(); }
    }, 200);
  }
}

function exportMeals() {
  const payload = {
    exported: new Date().toISOString(),
    version: 1,
    meals: state.meals
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0,10);
  a.href = url;
  a.download = `meals-${dateStr}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`⬇️ Exported ${state.meals.length} meal${state.meals.length !== 1 ? 's' : ''}`);
}

function importMeals(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      // Accept either { meals: [...] } wrapper or a bare array
      const incoming = Array.isArray(data) ? data : (data.meals || []);
      if (!incoming.length) { showToast('⚠️ No meals found in file'); return; }

      let added = 0, skipped = 0;
      incoming.forEach(meal => {
        // Deduplicate by name (case-insensitive)
        const exists = state.meals.some(m => m.name.trim().toLowerCase() === meal.name.trim().toLowerCase());
        if (exists) { skipped++; return; }
        // Ensure IDs are fresh to avoid collisions
        meal.id = uid();
        meal.ingredients = (meal.ingredients || []).map(ing => ({ ...ing, id: uid() }));
        state.meals.push(meal);
        added++;
      });

      saveState();
      renderMeals();
      const msg = skipped > 0
        ? `⬆️ Imported ${added} meal${added !== 1 ? 's' : ''} (${skipped} already existed)`
        : `⬆️ Imported ${added} meal${added !== 1 ? 's' : ''}`;
      showToast(msg);
    } catch (err) {
      showToast('❌ Invalid JSON file');
    }
    // Reset the file input so the same file can be re-imported if needed
    event.target.value = '';
  };
  reader.readAsText(file);
}

// ══════════════════════════════════════════════
//  SHOPPING LIST
// ══════════════════════════════════════════════
function renderShopping() {
  const container = document.getElementById('shopping-items');
  container.innerHTML = '';

  if (!state.shopping.length) {
    container.innerHTML = '<div class="empty-state"><span class="empty-emoji">🛒</span>Your list is empty.<br>Add items from your week plan or type above.</div>';
    document.getElementById('shop-count').textContent = '0 items';
    return;
  }

  const total = state.shopping.length;
  const done = state.shopping.filter(i => i.checked).length;
  document.getElementById('shop-count').textContent = `${total - done} remaining / ${total} total`;

  state.shopping.forEach(item => {
    const div = document.createElement('div');
    div.className = 'shop-item' + (item.checked ? ' checked' : '');
    div.id = 'shopitem-' + item.id;
    div.innerHTML = `
      <div class="shop-item-check" onclick="toggleShopItem('${item.id}')">${item.checked ? '✓' : ''}</div>
      <div class="shop-item-text">
        <input type="text" value="${escapeHtml(item.name)}" onchange="updateShopItem('${item.id}',this.value)" ${item.checked ? 'disabled' : ''}>
      </div>
      ${item.source ? `<span class="shop-item-source">${item.source}</span>` : ''}
      <button class="del-btn" onclick="removeShopItem('${item.id}')">✕</button>
    `;
    container.appendChild(div);
  });

  updateKeepPreview();
}

function toggleShopItem(id) {
  const item = state.shopping.find(i => i.id === id);
  if (item) { item.checked = !item.checked; saveState(); renderShopping(); }
}

function updateShopItem(id, value) {
  const item = state.shopping.find(i => i.id === id);
  if (item) { item.name = value; saveState(); }
}

function removeShopItem(id) {
  state.shopping = state.shopping.filter(i => i.id !== id);
  saveState();
  renderShopping();
}

function addAdhocItem() {
  const input = document.getElementById('adhoc-input');
  const val = input.value.trim();
  if (!val) return;
  state.shopping.push({ id: uid(), name: val, source: '', checked: false });
  input.value = '';
  saveState();
  renderShopping();
  showToast('➕ Added to list');
}

function clearChecked() {
  state.shopping = state.shopping.filter(i => !i.checked);
  saveState();
  renderShopping();
  showToast('✅ Cleared completed items');
}

function clearAll() {
  if (!state.shopping.length) return;
  if (!confirm('Clear the entire shopping list?')) return;
  state.shopping = [];
  saveState();
  renderShopping();
  showToast('🗑️ List cleared');
}

// ══════════════════════════════════════════════
//  GOOGLE KEEP COPY
// ══════════════════════════════════════════════
function updateKeepPreview() {
  const preview = document.getElementById('keep-preview');
  if (!state.shopping.length) {
    preview.textContent = 'Your list will appear here…';
    return;
  }
  const lines = state.shopping
    .filter(i => !i.checked)
    .map(i => i.name)
    .join('\n');
  const checkedLines = state.shopping
    .filter(i => i.checked)
    .map(i => i.name)
    .join('\n');
  preview.textContent = lines + (checkedLines ? '\n\n' + checkedLines : '');
}

function copyForKeep() {
  updateKeepPreview();
  const text = document.getElementById('keep-preview').textContent;
  if (!text || text === 'Your list will appear here…') {
    showToast('⚠️ Nothing to copy'); return;
  }
  navigator.clipboard.writeText(text).then(() => {
    showToast('📋 Copied! Open Google Keep and paste 🎉');
  }).catch(() => {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('📋 Copied to clipboard!');
  });
}

// ══════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ══════════════════════════════════════════════
//  BOOT
// ══════════════════════════════════════════════
loadState();
renderPlanner();
renderMeals();
renderShopping();
