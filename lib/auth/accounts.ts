import { UserAccount } from "./definitions";

export const accounts: UserAccount[] = [
  { id: 1, name: "Myrna Van Wagoner", avatar: "/placeholder.svg?height=40&width=40" },
  { id: 2, name: "Gerret Van Wagoner", avatar: "/placeholder.svg?height=40&width=40" },
  { id: 3, name: "Elise Gardner", avatar: "/placeholder.svg?height=40&width=40" },
  { id: 4, name: "Matt Gardner", avatar: "/placeholder.svg?height=40&width=40" },
  { id: 5, name: "Ashley Maxwell", avatar: "/placeholder.svg?height=40&width=40" },
  { id: 6, name: "Jordan Maxwell", avatar: "/placeholder.svg?height=40&width=40" },
  { id: 7, name: "Kayla Van Wagoner", avatar: "/placeholder.svg?height=40&width=40" },
  { id: 8, name: "Logan Van Wagoner", avatar: "/placeholder.svg?height=40&width=40" },
  { id: 9, name: "Landon Van Wagoner", avatar: "/placeholder.svg?height=40&width=40" },
  { id: 10, name: "Brennah Van Wagoner", avatar: "/placeholder.svg?height=40&width=40" },
  { id: 11, name: "Savanah Van Wagoner", avatar: "/placeholder.svg?height=40&width=40" },
]

export function fetchUsersAsMap() {
  return accounts.reduce((acc, user) => {
    acc.set(user.id, user)
    return acc;
  }, new Map() as Map<number, UserAccount>);
}

export function fetchAccountById(userId: number) {
  return accounts.find(user => user.id == userId)
}
