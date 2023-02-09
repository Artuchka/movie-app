const { default: axios } = require("axios")
import flagList from "./flag-list"
const movieContainer = document.querySelector("#movieContainer")
const searchInputElement = document.querySelector("#searchInput")

require("dotenv").config()

loadMovies()

searchInputElement.addEventListener("keydown", async (e) => {
	if (e.key !== "Enter") return

	const movieName = searchInputElement.value
	searchInputElement.value = ""

	const movieList = await getMovies(movieName)
	movieContainer.innerHTML = ""

	movieList.forEach(async (movieDataPromise) => {
		movieDataPromise.then((movieData) => {
			addMovie(movieData)
		})
	})

	console.log("serching")
})

async function loadMovies() {
	movieContainer.innerHTML = ""

	const movieTitleList = await getMovieTitles()

	movieTitleList.forEach(async (title) => {
		const movieData = await getMovieData(title)
		if (movieData !== false) addMovie(movieData)
	})
}

const templateMovieItem = document.querySelector("#movieItemContainerTemplate")
function addMovie({
	title,
	year,
	posterURL,
	rating,
	country,
	genre,
	overview,
	actors,
}) {
	const element = templateMovieItem.content.cloneNode(true)

	setValue("movie-title", element, title)
	setValue("movie-year", element, year)
	setValue("movie-rating", element, rating)
	setValue("overview-text", element, overview)
	setValue("overview-country", element, `${country} ${getFlag(country)}`)
	setValue("overview-genre", element, genre)
	setValue("overview-actors", element, actors)

	setPoster(element, posterURL)

	movieContainer.append(element)
}

function setValue(selector, element, text) {
	element.querySelector(`[data-${selector}]`).textContent = text
}
function setPoster(element, url) {
	element.querySelector("[data-movie-poster]").src = url
}
function getFlag(countryNames) {
	const names = countryNames.split(", ")
	return Object.values(flagList).reduce((prev, flagObj) => {
		const flags = names.reduce((result, name) => {
			if (name == flagObj.name) return result + flagObj.emoji
			return result
		}, "")
		return prev + flags
	}, "")
}

function getSearchUrl(movieName, { page = "1" } = {}) {
	return `http://www.omdbapi.com/?s=${movieName}&apikey=${process.env.API_KEY}`
}

async function getMovieTitles() {
	const data = await require("./movie-list.json").movieList
	return data
}

async function getMovieData(title) {
	return axios.get(getSearchUrl(title)).then(async ({ data }) => {
		if (data.Response === "False") return false

		const { imdbID: id } = data.Search[0]
		const detailed = await getMovieDetails(id)
		const {
			Title: title,
			Year: year,
			imdbRating: rating,
			Poster: posterURL,
			Country: country,
			Genre: genre,
			Plot: overview,
			Actors: actors,
		} = detailed
		return {
			title,
			year,
			posterURL,
			rating,
			country,
			genre,
			overview,
			actors,
		}
	})
}

async function getMovieDetails(id) {
	return axios
		.get(`http://www.omdbapi.com/?i=${id}&apikey=${process.env.API_KEY}`)
		.then(({ data }) => {
			return data
		})
}

async function getMovies(title) {
	return axios.get(getSearchUrl(title)).then(({ data }) => {
		if (data.Response === "False") return false

		const ret = data.Search.map(async (movie) => {
			const { imdbID: id } = movie
			const detailed = await getMovieDetails(id)
			const {
				Title: title,
				Year: year,
				imdbRating: rating,
				Poster: posterURL,
				Country: country,
				Genre: genre,
				Plot: overview,
				Actors: actors,
			} = detailed
			return {
				title,
				year,
				posterURL,
				rating,
				country,
				genre,
				overview,
				actors,
			}
		})
		return ret
	})
}
