console.log("This is a News Website Project / app.js");
// Initialize the G News api parameters
const apiKey = "f5b874a8cc8c944a5ef4fcf58b8a59b9";
let apiCountry = "in";
let apiLanguage = "en";
let apiCategory = "general";
let apiQuery = "";
const now = new Date();
const formattedDateTime = now
  .toISOString()
  .replace(" ", "T")
  .replace(".000Z", "Z");
const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  .toISOString()
  .replace(" ", "T")
  .replace(".000Z", "Z");
let apiFrom = oneWeekAgo;
let apiTo = formattedDateTime;
let apiUrl = `https://gnews.io/api/v4/top-headlines?country=${apiCountry}&lang=${apiLanguage}&from=${apiFrom}&to=${apiTo}&category=${apiCategory}&apikey=${apiKey}`;
// To make date into api format
function getFullDateForYear(year) {
  const formattedDate = new Date(year, 0, 1, 0, 0, 0)
    .toISOString()
    .replace(" ", "T")
    .replace(".000Z", "Z");
  return formattedDate;
}
function getFullDateForYear2(year) {
  const formattedDate = new Date(year, 11, 31, 0, 0, 0)
    .toISOString()
    .replace(" ", "T")
    .replace(".000Z", "Z");
  return formattedDate;
}
// Grabbing the News Container
accordionNews = document.getElementById("accordionNews");
function toLoadNews(apiUrl) {
  // Clear the accordion and put a loading Screen
  accordionNews.innerHTML = `<div class="d-flex justify-content-center">
                               <div class="spinner-border" role="status">
                                   <span class="visually-hidden">Loading...</span>
                                   <div class="spinner-grow text-secondary" role="status">
                                         <span class="visually-hidden">Loading...</span>
                                   </div>
                               </div>
                             </div>`;
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
                      <button type="button" class="btn-close" id="buttonClose" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                    </div>
                    <div class="offcanvas-body">
                      No news related to the query found. Please try other News Source or Word. !!!
                    </div>
                  </div>`;
          accordionNews.innerHTML = blanknewsHtml;
          buttonClose.addEventListener("click", function () {
            accordionNews.innerHTML = "";
          });
        }
      } else {
        let newsHtml = ``;
        articles.forEach(function (element, index) {
          // console.log(element);
          if (element.title === null) {
            element.title = "No Title Available";
          }
          if (element.description === null) {
            element.description = "No Description Available";
          }
          if (element.content === null) {
            element.content = "No Description Available";
          }
          let news, newsAnother;
          if (index == 0) {
            accordionNews.innerHTML = "";
            news = `
                            <div class="accordion-item">
                            <img src="${
                              element.image
                            }" class="card-img-top" alt="Image of ${
              element.title
            }">
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
                                    Description: ${element.description} ||
                                    </div>
                                    <div class="accordion-body">
                                    Content: ${element.content} ||  <a href='${
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
                            <img src="${
                              element.image
                            }" class="card-img-top" alt="Image of ${
              element.title
            }">
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
                                Description: ${element.description} ||
                                </div>
                                <div class="accordion-body">
                                Content: ${element.content} ||  <a href='${
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
  // console.log(apiCountry);
  // console.log(apiLanguage);
  // console.log(apiCategory);
  console.log(apiUrl);
}

IN2.addEventListener("click", function changeCountry() {
  apiCountry = "in";
  US2.classList.remove("active");
  AU2.classList.remove("active");
  NL2.classList.remove("active");
  CH2.classList.remove("active");
  HI2.classList.remove("active");
  EN2.classList.remove("active");
  Home.classList.add("active");
  IN2.classList.add("active");
  countryButton.innerText = "Choose Specific Country";
  apiUrl = `https://gnews.io/api/v4/top-headlines?country=${apiCountry}&lang=${apiLanguage}&from=${apiFrom}&to=${apiTo}&category=${apiCategory}&apikey=${apiKey}`;
  toLoadNews(apiUrl);
});
US2.addEventListener("click", function changeCountry() {
  apiCountry = "us";
  Home.classList.remove("active");
  IN2.classList.remove("active");
  AU2.classList.remove("active");
  NL2.classList.remove("active");
  CH2.classList.remove("active");
  HI2.classList.remove("active");
  EN2.classList.remove("active");
  US2.classList.add("active");
  countryButton.innerText = "Choose Specific Country";
  apiUrl = `https://gnews.io/api/v4/top-headlines?country=${apiCountry}&lang=${apiLanguage}&from=${apiFrom}&to=${apiTo}&category=${apiCategory}&apikey=${apiKey}`;
  toLoadNews(apiUrl);
});
AU2.addEventListener("click", function changeCountry() {
  apiCountry = "au";
  Home.classList.remove("active");
  IN2.classList.remove("active");
  US2.classList.remove("active");
  NL2.classList.remove("active");
  CH2.classList.remove("active");
  HI2.classList.remove("active");
  EN2.classList.remove("active");
  AU2.classList.add("active");
  countryButton.innerText = "Choose Specific Country";
  apiUrl = `https://gnews.io/api/v4/top-headlines?country=${apiCountry}&lang=${apiLanguage}&from=${apiFrom}&to=${apiTo}&category=${apiCategory}&apikey=${apiKey}`;
  toLoadNews(apiUrl);
});
NL2.addEventListener("click", function changeCountry() {
  apiCountry = "nl";
  Home.classList.remove("active");
  IN2.classList.remove("active");
  US2.classList.remove("active");
  AU2.classList.remove("active");
  CH2.classList.remove("active");
  HI2.classList.remove("active");
  EN2.classList.remove("active");
  NL2.classList.add("active");
  countryButton.innerText = "Choose Specific Country";
  apiUrl = `https://gnews.io/api/v4/top-headlines?country=${apiCountry}&lang=${apiLanguage}&from=${apiFrom}&to=${apiTo}&category=${apiCategory}&apikey=${apiKey}`;
  toLoadNews(apiUrl);
});
CH2.addEventListener("click", function changeCountry() {
  apiCountry = "ch";
  Home.classList.remove("active");
  IN2.classList.remove("active");
  US2.classList.remove("active");
  AU2.classList.remove("active");
  NL2.classList.remove("active");
  HI2.classList.remove("active");
  EN2.classList.remove("active");
  CH2.classList.add("active");
  countryButton.innerText = "Choose Specific Country";
  apiUrl = `https://gnews.io/api/v4/top-headlines?country=${apiCountry}&lang=${apiLanguage}&from=${apiFrom}&to=${apiTo}&category=${apiCategory}&apikey=${apiKey}`;
  toLoadNews(apiUrl);
});
HI2.addEventListener("click", function changeCountry() {
  apiLanguage = "hi";
  Home.classList.remove("active");
  IN2.classList.remove("active");
  US2.classList.remove("active");
  AU2.classList.remove("active");
  NL2.classList.remove("active");
  CH2.classList.remove("active");
  EN2.classList.remove("active");
  HI2.classList.add("active");
  languageButton.innerText = "Choose Specific Language";
  apiUrl = `https://gnews.io/api/v4/top-headlines?country=${apiCountry}&lang=${apiLanguage}&from=${apiFrom}&to=${apiTo}&category=${apiCategory}&apikey=${apiKey}`;
  toLoadNews(apiUrl);
});
EN2.addEventListener("click", function changeCountry() {
  apiSource = "en";
  Home.classList.remove("active");
  IN2.classList.remove("active");
  US2.classList.remove("active");
  AU2.classList.remove("active");
  NL2.classList.remove("active");
  CH2.classList.remove("active");
  HI2.classList.remove("active");
  EN2.classList.add("active");
  languageButton.innerText = "Choose Specific Language";
  apiUrl = `https://gnews.io/api/v4/top-headlines?country=${apiCountry}&lang=${apiLanguage}&from=${apiFrom}&to=${apiTo}&category=${apiCategory}&apikey=${apiKey}`;
  toLoadNews(apiUrl);
});
currentDate.addEventListener("click", function changeCountry() {
  fromButton.innerText = "Within a Week";
  apiFrom = oneWeekAgo;
  apiTo = formattedDateTime;
  apiUrl = `https://gnews.io/api/v4/top-headlines?country=${apiCountry}&lang=${apiLanguage}&from=${apiFrom}&to=${apiTo}&category=${apiCategory}&apikey=${apiKey}`;
  toLoadNews(apiUrl);
});
country_dropdowns = document.querySelectorAll("li > a.country-item");
// console.log(country_dropdowns);
for (country_dropdown of country_dropdowns) {
  country_dropdown.addEventListener("click", (e) => {
    countryButton.innerText = e.target.innerText;
    apiCountry = e.target.id;
    apiCountry = apiCountry.toLowerCase();
    apiUrl = `https://gnews.io/api/v4/top-headlines?country=${apiCountry}&lang=${apiLanguage}&from=${apiFrom}&to=${apiTo}&category=${apiCategory}&apikey=${apiKey}`;
    toLoadNews(apiUrl);
  });
}
category_dropdowns = document.querySelectorAll("li > a.category-item");
// console.log(category_dropdowns);
for (category_dropdown of category_dropdowns) {
  category_dropdown.addEventListener("click", (e) => {
    categoryButton.innerText = e.target.innerText;
    apiCategory = e.target.id;
    apiCategory = apiCategory.toLowerCase();
    apiUrl = `https://gnews.io/api/v4/top-headlines?country=${apiCountry}&lang=${apiLanguage}&from=${apiFrom}&to=${apiTo}&category=${apiCategory}&apikey=${apiKey}`;
    toLoadNews(apiUrl);
  });
}
language_dropdowns = document.querySelectorAll("li > a.language-item");
// console.log(language_dropdowns);
for (language_dropdown of language_dropdowns) {
  language_dropdown.addEventListener("click", (e) => {
    languageButton.innerText = e.target.innerText;
    apiLanguage = e.target.id;
    apiLanguage = apiLanguage.toLowerCase();
    apiUrl = `https://gnews.io/api/v4/top-headlines?country=${apiCountry}&lang=${apiLanguage}&from=${apiFrom}&to=${apiTo}&category=${apiCategory}&apikey=${apiKey}`;
    toLoadNews(apiUrl);
  });
}
from_dropdowns = document.querySelectorAll("li > a.from-item");
// console.log(from_dropdowns);
for (from_dropdown of from_dropdowns) {
  from_dropdown.addEventListener("click", (e) => {
    fromButton.innerText = e.target.innerText;
    year = parseInt(e.target.id);
    let fullDate = getFullDateForYear(year);
    apiFrom = fullDate;
    fullDate = getFullDateForYear2(year);
    apiTo = fullDate;
    apiUrl = `https://gnews.io/api/v4/top-headlines?country=${apiCountry}&lang=${apiLanguage}&from=${apiFrom}&to=${apiTo}&category=${apiCategory}&apikey=${apiKey}`;
    toLoadNews(apiUrl);
  });
}

submit.addEventListener("click", function (e) {
  e.preventDefault();
  let inputVal = newsSearch.value.toLowerCase();
  // console.log(inputVal);
  apiQuery = inputVal;
  apiUrl = `https://gnews.io/api/v4/search?q=${apiQuery}&country=${apiCountry}&lang=${apiLanguage}&from=${apiFrom}&to=${apiTo}&category=${apiCategory}&apikey=${apiKey}`;
  toLoadNews(apiUrl);
});

toLoadNews(apiUrl);
// To do's
// 1. Ask User which country news they want to see & show them to specific country news
// 2. Ask User which news channel they want to see & show them to specific news from the channel
// 3. Search News by Queries *
// And Many More
