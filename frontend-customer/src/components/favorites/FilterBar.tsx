import { Filter, Grid, List, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";

export const FilterBar = ({
    totalCount,
    shownCount,
    invalidCount,
    sortBy,
    setSortBy,
    viewMode,
    setViewMode,
    showOnlyAvailable,
    setShowOnlyAvailable,
    onClearRequest,
    t
}: any) => {
    const ViewToggle = () => (
        <div className="flex items-center bg-muted rounded-lg p-1">
            <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-7 w-7 p-0"
            >
                <Grid className="w-3 h-3" />
            </Button>
            <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-7 w-7 p-0"
            >
                <List className="w-3 h-3" />
            </Button>
        </div>
    );

    const SortSelect = () => (
        <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger size="sm" className="h-7 text-xs w-[110px] sm:w-[140px]">
                <SelectValue placeholder={t('sort.label')} />
            </SelectTrigger>
            <SelectContent className="text-xs">
                <SelectItem value="dateAdded">{t('sort.dateAdded')}</SelectItem>
                <SelectItem value="name">{t('sort.name')}</SelectItem>
                <SelectItem value="status">{t('sort.status')}</SelectItem>
            </SelectContent>
        </Select>
    );

    const AvailabilityToggle = () => (
        <Button
            variant={showOnlyAvailable ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowOnlyAvailable(!showOnlyAvailable)}
            className="gap-1 text-xs h-7"
        >
            <Filter className="w-3 h-3" />
            <span className="hidden xs:inline">{t('controls.availableOnly')}</span>
        </Button>
    );

    return (
        <div className="sticky z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-4 py-3">
            <div className="flex gap-3 items-center justify-between">
                {/* Mobile/Compact View Wrapper */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
                    <AvailabilityToggle />
                    <SortSelect />
                    <ViewToggle />

                    {invalidCount > 0 && (
                        <Badge variant="destructive" className="h-7 px-2 text-[10px] whitespace-nowrap">
                            {invalidCount} {t('validation.unavailable')}
                        </Badge>
                    )}
                </div>

                {/* Counter & Clear Button */}
                <div className="flex items-center justify-end gap-3 text-xs text-muted-foreground w-fit sm:w-auto">
                    <span>{t('controls.resultsCount', { shown: shownCount, total: totalCount })}</span>
                    {totalCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 hover:bg-destructive/10 hover:text-destructive"
                            onClick={onClearRequest}
                        >
                            <Trash2 className="w-3 h-3 mr-1" />
                            {/* {t('buttons.clearAll')} */}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};