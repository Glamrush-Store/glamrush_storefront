import countries from '~/assets/countries.json'

const countryList = countries

function matchesCountry(country, value) {
  return country.code2 === value || country.name === value
}

function toOption(label, value = label) {
  return { label, value }
}

export function useAddressLocationOptions(address) {
  const countryOptions = computed(() =>
    countryList.map(country => toOption(country.name, country.code2))
  )

  const selectedCountry = computed(() =>
    countryList.find(country => matchesCountry(country, address.country)) ?? null
  )

  const stateOptions = computed(() =>
    (selectedCountry.value?.states ?? []).map(state => toOption(state.name))
  )

  const selectedState = computed(() =>
    selectedCountry.value?.states?.find(state => state.name === address.state) ?? null
  )

  const cityOptions = computed(() =>
    (selectedState.value?.subdivision ?? []).map(city => toOption(city))
  )

  function resolveCountryCode(value) {
    if (!value) return ''
    return countryList.find(country => matchesCountry(country, value))?.code2 ?? value
  }

  return {
    countryOptions,
    stateOptions,
    cityOptions,
    resolveCountryCode,
  }
}
