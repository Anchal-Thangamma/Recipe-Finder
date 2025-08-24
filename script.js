const SPOON_API = "https://api.spoonacular.com/recipes/";
const API_KEY = "260ffede13d2408aaa946e07c2f2cd74"; // <-- replace with your Spoonacular API key

// DOM elements
const grid = document.getElementById("grid");
const status = document.getElementById("status");
const q = document.getElementById("q");

// pagination variables
let meals = [];
let currentPage = 1;
const perPage = 6;

// ---------- Caching ----------
function cacheResults(query, results) {
  localStorage.setItem(query, JSON.stringify(results));
}
function getCache(query) {
  const item = localStorage.getItem(query);
  return item ? JSON.parse(item) : null;
}

// ---------- Search ----------
async function search(query) {
  const cached = getCache(query);
  if (cached) {
    meals = cached;
    status.textContent = `Loaded from cache: ${meals.length} results`;
    currentPage = 1;
    render();
    return;
  }

  const res = await fetch(
    `${SPOON_API}complexSearch?query=${encodeURIComponent(query)}&number=30&apiKey=${API_KEY}`
  );
  const data = await res.json();
  meals = data.results || [];

  cacheResults(query, meals);
  status.textContent = `Found ${meals.length} recipes for "${query}"`;
  currentPage = 1;
  render();
}

// ---------- Render grid ----------
function render() {
  grid.innerHTML = "";
  if (meals.length === 0) return;

  const start = (currentPage - 1) * perPage;
  const pageMeals = meals.slice(start, start + perPage);

  for (const meal of pageMeals) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${meal.image}" alt="${meal.title}">
      <h3>${meal.title}</h3>
      <button onclick="openModal(${meal.id})">View Recipe</button>
    `;
    grid.appendChild(card);
  }

  document.getElementById("pageInfo").textContent =
    `Page ${currentPage} of ${Math.ceil(meals.length / perPage)}`;
}

// ---------- Modal with details + nutrition ----------
async function openModal(id) {
  const res = await fetch(
    `${SPOON_API}${id}/information?includeNutrition=true&apiKey=${API_KEY}`
  );
  const meal = await res.json();

  document.getElementById("modalTitle").textContent = meal.title;
  document.getElementById("modalImg").src = meal.image;
  document.getElementById("ins").textContent = meal.instructions || "No instructions available.";

  // Ingredients list
  const ing = meal.extendedIngredients.map(
    ing => `<li>${ing.original}</li>`
  );
  document.getElementById("ing").innerHTML = `<ul>${ing.join("")}</ul>`;

  // Nutrition info
  const nutrients = meal.nutrition?.nutrients || [];
  const cal = nutrients.find(n => n.name === "Calories");
  const protein = nutrients.find(n => n.name === "Protein");
  const carbs = nutrients.find(n => n.name === "Carbohydrates");
  const fat = nutrients.find(n => n.name === "Fat");

  document.getElementById("calories").textContent =
    `Calories: ${cal ? cal.amount + " " + cal.unit : "N/A"}`;
  document.getElementById("protein").textContent =
    `Protein: ${protein ? protein.amount + " " + protein.unit : "N/A"}`;
  document.getElementById("carbs").textContent =
    `Carbs: ${carbs ? carbs.amount + " " + carbs.unit : "N/A"}`;
  document.getElementById("fat").textContent =
    `Fat: ${fat ? fat.amount + " " + fat.unit : "N/A"}`;

  document.getElementById("modal").showModal();
}

// ---------- Close modal ----------
document.getElementById("modalClose").addEventListener("click", () => {
  document.getElementById("modal").close();
});

// ---------- Search input ----------
document.getElementById("clear").addEventListener("click", () => {
  q.value = "";
  grid.innerHTML = "";
  status.textContent = "";
});

q.addEventListener("keydown", (e) => {
  if (e.key === "Enter") search(q.value.trim());
});

// ---------- Pagination buttons ----------
document.getElementById("prevPage").addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    render();
  }
});

document.getElementById("nextPage").addEventListener("click", () => {
  if (currentPage < Math.ceil(meals.length / perPage)) {
    currentPage++;
    render();
  }
});