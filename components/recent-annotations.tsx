'use client'

import { Annotation } from "@/types/scripture"
import { fetchUsersAsMap } from "@/lib/auth/accounts"
import { useWebSocket } from "@/hooks/use-websockets"
import AnnotationViewer from "./feed/annotation-viewer"

export function RecentAnnotations({recentAnnotations}: {recentAnnotations: Annotation[]}) {
    const userMap = fetchUsersAsMap()
    const { annotations } = useWebSocket(recentAnnotations, true) 
    return (
        <div className="grid">
            {
                annotations.map((annotation, index) => {
                    const user = userMap.get(annotation.userId)
                    return user ?
                        <AnnotationViewer
                            index={index}
                            key={annotation._id?.toString()} 
                            author={user} 
                            annotation={annotation} 
                            userMap={userMap}
                        />
                    : null
                }
            )
        }
        </div>
    )
}

