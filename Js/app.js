// Initialize the News api parameters
const apiKey = "5c919137e21e4c789372f47fd7157c4e";
let apiCountry = "in";
let apiUrl = `https://newsapi.org/v2/top-headlines?country=${apiCountry}&apiKey=${apiKey}`;
let apiSource = "google-news";
let apiCategory = "general";
let apiQuery = "";
// Grabbing the News Container
accordionNews = document.getElementById("accordionNews");
console.log("This is a News Website Project / app.js");
function toLoadNews(apiUrl) {
  // Clear the accordion
  accordionNews.innerHTML = "";
  // Create a GET request
  const xhr = new XMLHttpRequest();
  xhr.open("GET", `${apiUrl}`, true);
  // What to do when response is ready
  xhr.onload = function () {
    if (this.status === 200) {
      let json = JSON.parse(this.responseText);
      let articles = json.articles;
      console.log(articles);
      if (articles.length === 0) {
        if (accordionNews.innerHTML == "") {
          blanknewsHtml = `<div class="offcanvas offcanvas-start show" tabindex="-1" id="offcanvas" aria-labelledby="offcanvasLabel">
                    <div class="offcanvas-header">
                      <h5 class="offcanvas-title" id="offcanvasLabel">Oops !! Sorry </h5>
                      <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                    </div>
                    <div class="offcanvas-body">
                      No news related to the query found. Please try other News Source or Word. !!!
                    </div>
                  </div>`;
          accordionNews.innerHTML = blanknewsHtml;
        }
      } else {
        let newsHtml = ``;
        articles.forEach(function (element, index) {
          // console.log(element);
          if (element.title === null) {
            element.title = "No Title Available";
          }
          if (element.content === null) {
            element.content = "No Content Available";
          }
          let news, newsAnother;
          if (index == 0) {
            accordionNews.innerHTML = "";
            news = `
                            <div class="accordion-item">
                                <h2 class="accordion-header" id="heading${index}">
                                    <button class="accordion-button" type="button" data-bs-toggle="collapse"
                                        data-bs-target="#collapse${index}" aria-expanded="true" aria-controls="collapse${index}">
                                       <b> Breaking News : ${
                                         index + 1
                                       } -></b> ${element.title}
                                    </button>
                                </h2>
                                <div id="collapse${index}" class="accordion-collapse collapse show" aria-labelledby="heading${index}"
                                    data-bs-parent="#accordionNews">
                                    <div class="accordion-body">
                                    ${element.content} ||  <a href='${
              element.url
            }' target="_blank"><code>Read More Here</code></a> || 
                                    <strong> Source : ${
                                      element.source.name
                                    } || </strong>
                                    <strong> Published At : ${
                                      element.publishedAt
                                    }</strong></div>
                                </div>
                            </div>`;
            newsAnother = ``;
          } else {
            news = ``;
            newsAnother = `
                            <div class="accordion-item">
                                <h2 class="accordion-header" id="heading${index}">
                                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                                        data-bs-target="#collapse${index}" aria-expanded="false" aria-controls="collapse${index}">
                                        <b> Breaking News : ${
                                          index + 1
                                        } -></b>  ${element.title}
                                    </button>
                                </h2>
                                <div id="collapse${index}" class="accordion-collapse collapse" aria-labelledby="heading${index}"
                                    data-bs-parent="#accordionNews">
                                    <div class="accordion-body">
                                    ${element.content}  || <a href='${
              element.url
            }' target="_blank"><code>Read More Here</code></a> || 
                                    <strong>Source : ${
                                      element.source.name
                                    } || </strong>
                                    <strong>Published At : ${
                                      element.publishedAt
                                    }</strong></div>
                                </div>
                            </div>`;
          }
          newsHtml += news + newsAnother;
        });
        accordionNews.innerHTML = newsHtml;
      }
    } else {
      console.error("Some error Occured!");
    }
  };
  xhr.send();
  console.log(apiCountry);
  console.log(apiSource);
  console.log(apiCategory);
}

IN2.addEventListener("click", function changeCountry() {
  apiCountry = "in";
  US2.classList.remove("active");
  AU2.classList.remove("active");
  NZ2.classList.remove("active");
  ZA2.classList.remove("active");
  ABC.classList.remove("active");
  BBC.classList.remove("active");
  Home.classList.add("active");
  IN2.classList.add("active");
  let apiUrl = `https://newsapi.org/v2/top-headlines?country=${apiCountry}&category=${apiCategory}&apiKey=${apiKey}`;
  toLoadNews(apiUrl);
});
US2.addEventListener("click", function changeCountry() {
  apiCountry = "us";
  Home.classList.remove("active");
  IN2.classList.remove("active");
  AU2.classList.remove("active");
  NZ2.classList.remove("active");
  ZA2.classList.remove("active");
  ABC.classList.remove("active");
  BBC.classList.remove("active");
  US2.classList.add("active");
  let apiUrl = `https://newsapi.org/v2/top-headlines?country=${apiCountry}&category=${apiCategory}&apiKey=${apiKey}`;
  toLoadNews(apiUrl);
});
AU2.addEventListener("click", function changeCountry() {
  apiCountry = "au";
  Home.classList.remove("active");
  US2.classList.remove("active");
  IN2.classList.remove("active");
  NZ2.classList.remove("active");
  ZA2.classList.remove("active");
  ABC.classList.remove("active");
  BBC.classList.remove("active");
  AU2.classList.add("active");
  let apiUrl = `https://newsapi.org/v2/top-headlines?country=${apiCountry}&category=${apiCategory}&apiKey=${apiKey}`;
  toLoadNews(apiUrl);
});
NZ2.addEventListener("click", function changeCountry() {
  apiCountry = "nz";
  Home.classList.remove("active");
  US2.classList.remove("active");
  IN2.classList.remove("active");
  AU2.classList.remove("active");
  ZA2.classList.remove("active");
  ABC.classList.remove("active");
  BBC.classList.remove("active");
  NZ2.classList.add("active");
  apiUrl = `https://newsapi.org/v2/top-headlines?country=${apiCountry}&category=${apiCategory}&apiKey=${apiKey}`;
  toLoadNews(apiUrl);
});
ZA2.addEventListener("click", function changeCountry() {
  apiCountry = "za";
  Home.classList.remove("active");
  US2.classList.remove("active");
  IN2.classList.remove("active");
  AU2.classList.remove("active");
  NZ2.classList.remove("active");
  ABC.classList.remove("active");
  BBC.classList.remove("active");
  ZA2.classList.add("active");
  apiUrl = `https://newsapi.org/v2/top-headlines?country=${apiCountry}&category=${apiCategory}&apiKey=${apiKey}`;
  toLoadNews(apiUrl);
});
BBC.addEventListener("click", function changeCountry() {
  apiSource = "bbc-news";
  Home.classList.remove("active");
  US2.classList.remove("active");
  IN2.classList.remove("active");
  AU2.classList.remove("active");
  NZ2.classList.remove("active");
  ZA2.classList.remove("active");
  ABC.classList.remove("active");
  BBC.classList.add("active");
  categoryButton.innerText = "Choose Specific Category";
  apiCategory = "general";
  countryButton.innerText = "Choose Specific Country";
  apiCountry = "in";
  apiUrl = `https://newsapi.org/v2/top-headlines?sources=${apiSource}&apiKey=${apiKey}`;
  toLoadNews(apiUrl);
});
ABC.addEventListener("click", function changeCountry() {
  apiSource = "abc-news";
  Home.classList.remove("active");
  US2.classList.remove("active");
  IN2.classList.remove("active");
  AU2.classList.remove("active");
  NZ2.classList.remove("active");
  ZA2.classList.remove("active");
  BBC.classList.remove("active");
  ABC.classList.add("active");
  categoryButton.innerText = "Choose Specific Category";
  apiCategory = "general";
  countryButton.innerText = "Choose Specific Country";
  apiCountry = "in";
  apiUrl = `https://newsapi.org/v2/top-headlines?sources=${apiSource}&apiKey=${apiKey}`;
  toLoadNews(apiUrl);
});
country_dropdowns = document.querySelectorAll("li > a.country-item");
// console.log(dropdowns);
for (country_dropdown of country_dropdowns) {
  country_dropdown.addEventListener("click", (e) => {
    countryButton.innerText = e.target.innerText;
    apiCountry = e.target.id;
    apiCountry = apiCountry.toLowerCase();
    apiUrl = `https://newsapi.org/v2/top-headlines?country=${apiCountry}&category=${apiCategory}&apiKey=${apiKey}`;
    toLoadNews(apiUrl);
  });
}
category_dropdowns = document.querySelectorAll("li > a.category-item");
// console.log(dropdowns);
for (category_dropdown of category_dropdowns) {
  category_dropdown.addEventListener("click", (e) => {
    categoryButton.innerText = e.target.innerText;
    apiCategory = e.target.id;
    apiCategory = apiCategory.toLowerCase();
    apiUrl = `https://newsapi.org/v2/top-headlines?country=${apiCountry}&category=${apiCategory}&apiKey=${apiKey}`;
    toLoadNews(apiUrl);
  });
}

submit.addEventListener("click", function (e) {
  e.preventDefault();
  let inputVal = newsSearch.value.toLowerCase();
  // console.log(inputVal);
  apiQuery = inputVal;
  apiUrl = `https://newsapi.org/v2/top-headlines?q=${apiQuery}&apiKey=${apiKey}`;
  toLoadNews(apiUrl);
});
toLoadNews(apiUrl);
// To do's
// 1. Ask User which country news they want to see & show them to specific country news
// 2. Ask User which news channel they want to see & show them to specific news from the channel
// 3. Search News by Queries *
// And Many More
