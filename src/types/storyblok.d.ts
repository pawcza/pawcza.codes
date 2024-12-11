export interface StoryblokComponent<T> {
    name: string;
    content: T;
    created_at: string;
    published_at: string;
    updated_at: string;
    id: number;
    uuid: string;
    full_slug: string;
    slug: string;
    tag_list: string[];
    alternates: string[];
    lang: string;
    is_startpage: boolean;
    parent_id: number;
    group_id: string;
    first_published_at: string;
    release_id: string;
    position: number;
}
